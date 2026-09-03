#!/usr/bin/env python3
"""
export_session.py — turn a the-room session pulled from its Supabase mirror into
coding-ready files, without printing any transcript content.

Inputs (in the session directory):
  events.json    a JSON array of room_events rows for one session, ordered by seq:
                 {seq, round, kind, ts, agentId, agentName, text, order}
  journals.json  a JSON array of room_journals rows: {round, ts, agentId, agentName, text}

Outputs (same directory):
  transcript.jsonl    the repository's own event shape (src/export.ts), one event per line
  transcript.md       readable transcript with a stable item id on every labelable unit
  coding_sheet.csv    one row per labelable unit, blank label columns for the three chat-room tasks

Usage:
  python3 export_session.py <session_dir>
"""

import csv
import json
import sys
from pathlib import Path


def main(session_dir: str) -> int:
    d = Path(session_dir)
    events = json.loads((d / "events.json").read_text())
    journals = json.loads((d / "journals.json").read_text()) if (d / "journals.json").exists() else []
    session_id = d.name

    # --- transcript.jsonl in the shape src/export.ts writes ---------------------------
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
    lines.sort(key=lambda x: x["ts"])
    (d / "transcript.jsonl").write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in lines) + "\n")

    # --- item ids: M001… for messages, J01… for journals ---------------------------------
    items = []
    m = j = 0
    for x in lines:
        if x["kind"] == "message":
            m += 1
            items.append({"id": f"M{m:03d}", "round": x["round"], "seat": x["agentName"], "channel": "message", "text": x["text"], "ts": x["ts"]})
        elif x["kind"] == "journal":
            j += 1
            items.append({"id": f"J{j:02d}", "round": x["round"], "seat": x["agentName"], "channel": "journal", "text": x["text"], "ts": x["ts"]})

    # --- transcript.md -----------------------------------------------------------------
    md = [f"# the-room session {session_id}", "",
          "Item ids (M… messages, J… journal entries) match `coding_sheet.csv`. System lines and speaking-order",
          "changes are shown for context and are not labelled. Journal entries were private to their writer.", ""]
    ids_by_ts = {(x["ts"], x["kind"]): it for x in lines for it in items if it["ts"] == x["ts"] and it["channel"] == x["kind"]}
    current_round = None
    for x in lines:
        if x["round"] != current_round and x["kind"] in ("message", "journal", "system"):
            current_round = x["round"]
            md += [f"## Round {current_round}", ""]
        if x["kind"] == "message":
            it = ids_by_ts[(x["ts"], "message")]
            md += [f"### {it['id']} · {x['agentName']}", "", x["text"], ""]
        elif x["kind"] == "journal":
            it = ids_by_ts[(x["ts"], "journal")]
            md += [f"### {it['id']} · {x['agentName']} — private journal entry", "", x["text"], ""]
        elif x["kind"] == "system":
            md += [f"> *system:* {x['text']}", ""]
        elif x["kind"] == "order":
            md += [f"> *speaking order:* {' → '.join(x['order'])}", ""]
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
    per_seat = {}
    for it in items:
        if it["channel"] == "message":
            per_seat[it["seat"]] = per_seat.get(it["seat"], 0) + 1
    print(f"{session_id}: {m} messages, {j} journal entries, {len(lines)} events, rounds 1–{max(x['round'] for x in lines)}")
    print("messages per seat:", ", ".join(f"{k} {v}" for k, v in sorted(per_seat.items())))
    print("wrote transcript.jsonl, transcript.md, coding_sheet.csv")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
