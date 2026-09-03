#!/usr/bin/env python3
"""
export_session.py — turn one the-room session into coding-ready files, without printing
any transcript content.

Accepts a session directory in either of two shapes:

  A. what the-room's own exporter writes (`npm run export -- <sessionId>` → sessions/<id>/):
       transcript.jsonl        one RoomEvent per line (src/export.ts / the live sink)
       journals/<agentId>.md   entries under "## Round N — <ISO timestamp>" headers
     A live run's session folder has the same layout.

  B. raw rows pulled straight from the Supabase mirror (what this lesson shipped with):
       events.json     room_events rows: {seq, round, kind, ts, agentId, agentName, text, order}
       journals.json   room_journals rows: {round, ts, agentId, agentName, text}

Outputs (same directory):
  transcript.jsonl    (shape B only — shape A already has it; never overwritten)
  transcript.md       readable transcript with a stable item id on every labelable unit
  coding_sheet.csv    one row per labelable unit, blank label columns for the three chat-room tasks

Usage:
  python3 export_session.py <session_dir>
"""

import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

JOURNAL_HEADER = re.compile(r"^## Round (\d+) — (\S+)\s*$", re.M)


def iso_key(ts: str) -> str:
    """Normalise '…+00:00' and '…Z' timestamps to one comparable form (UTC, ms)."""
    t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    return t.astimezone(timezone.utc).isoformat(timespec="milliseconds")


def load_shape_a(d: Path) -> list[dict]:
    """transcript.jsonl + journals/*.md → a list of events with journal text filled in."""
    lines = [json.loads(l) for l in (d / "transcript.jsonl").read_text().splitlines() if l.strip()]
    # journal text lives in journals/<agentId>.md, keyed by (agentId, round, ts)
    texts: dict[tuple[str, int, str], str] = {}
    by_round: dict[tuple[str, int], list[str]] = {}
    jdir = d / "journals"
    if jdir.is_dir():
        for md in sorted(jdir.glob("*.md")):
            agent = md.stem
            body = md.read_text()
            parts = JOURNAL_HEADER.split(body)  # [pre, round, ts, text, round, ts, text, ...]
            for i in range(1, len(parts), 3):
                rnd, ts, text = int(parts[i]), parts[i + 1], parts[i + 2].strip("\n")
                texts[(agent, rnd, iso_key(ts))] = text
                by_round.setdefault((agent, rnd), []).append(text)
    out = []
    for e in lines:
        if e.get("kind") == "journal" and not e.get("text"):
            key = (e.get("agentId"), e.get("round"), iso_key(e["ts"]))
            text = texts.get(key)
            if text is None:  # fall back to the next unmatched entry for that agent+round
                pool = by_round.get((e.get("agentId"), e.get("round")), [])
                text = pool.pop(0) if pool else ""
            e = {**e, "text": text}
        out.append(e)
    return out


def load_shape_b(d: Path) -> list[dict]:
    """events.json + journals.json → the same event list, in src/export.ts's event shape."""
    events = json.loads((d / "events.json").read_text())
    journals = json.loads((d / "journals.json").read_text()) if (d / "journals.json").exists() else []
    lines = []
    for e in events:
        base = {"ts": e["ts"], "round": e["round"]}
        k = e["kind"]
        if k == "message":
            lines.append({"kind": "message", **base, "agentId": e["agentId"], "agentName": e["agentName"] or e["agentId"], "text": e["text"] or ""})
        elif k == "system":
            lines.append({"kind": "system", **base, "text": e["text"] or "", **({"agentId": e["agentId"]} if e.get("agentId") else {})})
        elif k == "order":
            lines.append({"kind": "order", **base, "order": e.get("order") or []})
        elif k == "end":
            lines.append({"kind": "end", **base})
    for j in journals:
        lines.append({"kind": "journal", "ts": j["ts"], "round": j["round"], "agentId": j["agentId"], "agentName": j["agentName"], "text": j["text"]})
    lines.sort(key=lambda x: iso_key(x["ts"]))
    (d / "transcript.jsonl").write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in lines) + "\n")
    return lines


def main(session_dir: str) -> int:
    d = Path(session_dir)
    session_id = d.name
    if (d / "transcript.jsonl").exists():
        lines, shape = load_shape_a(d), "A (transcript.jsonl + journals/*.md)"
    elif (d / "events.json").exists():
        lines, shape = load_shape_b(d), "B (events.json + journals.json)"
    else:
        print(f"{d}: need transcript.jsonl (the-room export) or events.json (raw rows)", file=sys.stderr)
        return 1

    # --- item ids: M001… for messages, J01… for journals ---------------------------------
    items = []
    m = j = 0
    for x in lines:
        if x["kind"] == "message":
            m += 1
            items.append({"id": f"M{m:03d}", "round": x["round"], "seat": x.get("agentName") or x.get("agentId"), "channel": "message", "text": x.get("text", ""), "ts": x["ts"]})
        elif x["kind"] == "journal":
            j += 1
            items.append({"id": f"J{j:02d}", "round": x["round"], "seat": x.get("agentName") or x.get("agentId"), "channel": "journal", "text": x.get("text", ""), "ts": x["ts"]})
    it_by = {(it["ts"], it["channel"]): it for it in items}

    # --- transcript.md -----------------------------------------------------------------
    md = [f"# the-room session {session_id}", "",
          "Item ids (M… messages, J… journal entries) match `coding_sheet.csv`. System lines and speaking-order",
          "changes are shown for context and are not labelled. Journal entries were private to their writer.", ""]
    current_round = None
    for x in lines:
        if x["kind"] not in ("message", "journal", "system", "order", "end"):
            continue  # search / file / run / source / config events are tool traffic, not coded here
        if x["round"] != current_round and x["kind"] in ("message", "journal", "system"):
            current_round = x["round"]
            md += [f"## Round {current_round}", ""]
        if x["kind"] == "message":
            md += [f"### {it_by[(x['ts'], 'message')]['id']} · {x.get('agentName') or x.get('agentId')}", "", x.get("text", ""), ""]
        elif x["kind"] == "journal":
            md += [f"### {it_by[(x['ts'], 'journal')]['id']} · {x.get('agentName') or x.get('agentId')} — private journal entry", "", x.get("text", ""), ""]
        elif x["kind"] == "system":
            md += [f"> *system:* {x.get('text', '')}", ""]
        elif x["kind"] == "order":
            md += [f"> *speaking order:* {' → '.join(x.get('order', []))}", ""]
        elif x["kind"] == "end":
            md += ["> *session ended*", ""]
    (d / "transcript.md").write_text("\n".join(md))

    # --- coding_sheet.csv --------------------------------------------------------------
    with open(d / "coding_sheet.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "round", "seat", "channel", "meta_talk", "speech_act", "doubt", "journal_orientation", "notes"])
        for it in items:
            w.writerow([it["id"], it["round"], it["seat"], it["channel"], "", "", "", "", ""])

    # --- report counts only; never content --------------------------------------------
    per_seat: dict[str, int] = {}
    for it in items:
        if it["channel"] == "message":
            per_seat[it["seat"]] = per_seat.get(it["seat"], 0) + 1
    empty_journals = sum(1 for it in items if it["channel"] == "journal" and not it["text"])
    rounds = [x["round"] for x in lines if x["kind"] in ("message", "journal")]
    print(f"{session_id} [shape {shape}]: {m} messages, {j} journal entries, {len(lines)} events, rounds {min(rounds)}–{max(rounds)}")
    print("messages per seat:", ", ".join(f"{k} {v}" for k, v in sorted(per_seat.items())))
    if empty_journals:
        print(f"warning: {empty_journals} journal event(s) had no matching text in journals/*.md")
    print("wrote transcript.md, coding_sheet.csv" + (", transcript.jsonl" if shape.startswith("B") else ""))
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    sys.exit(main(sys.argv[1]))
