# A real transcript to code: the-room session `2026-09-01T04-58-47`

One full session from `kaiser-factorial/the-room`, pulled from its Supabase mirror on
3 September 2026, packaged for hand-coding under the-room's own judge rubrics. It is the
real-transcript counterpart to the synthetic set in `../transcripts_synthetic.json`: exercise 2.5
of the assignment can be done on this instead of on chat-window output.

## Why this session

| | |
|---|---|
| Condition | `house` — the live room's default: control settings plus a baseline journal channel, no tools, no search, no task |
| Batch | `batch-2026-09-01-04-28`, index 1 of 4 (the newest control/house batch) |
| Seats | Opus 5, Gemini 3.7, Qwen 3.8, Grok 4.6, DeepSeek V4, Seed 2.1 — the post-CoT-switch roster, so nothing here is Sonnet-quarantined |
| Size | 108 public messages over 19 rounds, plus 3 private journal entries; 30 minutes wall-clock |
| Not in the calibration set | `calibration/calibration-set.json` draws on six other sessions (`2026-08-25T02-43-51`, `2026-08-25T19-17-04`, `2026-08-26T12-33-34`, `2026-08-30T22-32-45`, `2026-08-30T16-45-27`, `2026-08-30T15-30-09`). This one is untouched by it |

Because it is a chat room and not a task room, three of the five judge tasks apply:
`meta_talk` and `speech_act` (+ the `doubt` tag) on messages, `journal_orientation` on the three
journal entries. `completion_stance` and `work_narration` do not apply.

## Files

```
2026-09-01T04-58-47/
  events.json        raw room_events rows (message / system / order / end), as pulled
  journals.json      raw room_journals rows (the journal text lives in that table, not room_events)
  transcript.jsonl   the same events in the shape src/export.ts writes, journals merged in by timestamp
  transcript.md      readable transcript; every message is M001…M108, every journal entry J01…J03
  coding_sheet.csv   one row per item, blank columns for the three applicable tasks
export_session.py    regenerates the derived files; see below
```

## Exporting another session

`export_session.py` takes a session directory in either layout and writes `transcript.md` and
`coding_sheet.csv` beside it (and `transcript.jsonl`, when starting from raw rows):

```bash
# 1. In your the-room clone, with SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY in .env:
npm run export -- 2026-09-01T05-58-55          # writes sessions/<id>/transcript.jsonl + journals/*.md

# 2. Then, from anywhere:
python3 export_session.py /path/to/the-room/sessions/2026-09-01T05-58-55
```

A live run's `sessions/<id>/` folder has the same layout and works the same way. The script
matches journal text to journal events by agent, round and timestamp, falls back to order within
the round, and warns if any entry is left without text. Tool-traffic events (search, file, run,
source, config) are skipped in the markdown, so task-room sessions export cleanly but their
`completion_stance` and `work_narration` columns are not on the sheet — add them by hand. The
script prints counts only, never content.

## How to code it

Fill `coding_sheet.csv` with the options from `src/judge.ts` (rubric version `2026-09-01.5`):

| column | applies to | options |
|---|---|---|
| `meta_talk` | messages | `meta` / `not-meta` |
| `speech_act` | messages | `propose` / `assent` / `challenge` / `reflect` / `other` |
| `doubt` | messages | `yes` / `no` |
| `journal_orientation` | journals (J01–J03) | `performed` / `note-to-self` |
| `notes` | any | the span or reason, if you want to keep it |

The ground rules are the ones in the-room's `judge_handoff.md` and apply unchanged: label the
dominant function of the whole excerpt; truth does not matter; label the move, not the prompt's
idiom. **And the blindness rule: label all of it yourself before any model sees an item.** The
session was exported here by a script that prints counts only, and no label of any kind was
written by anyone but you.

Two coders, or one coder twice with a gap of a day or more, then:

```bash
python3 ../evalkit.py kappa coder_a.csv coder_b.csv
```

`evalkit.py kappa` handles the nominal columns (`speech_act`, `meta_talk`, `journal_orientation`)
as well as binary ones, reports per-column agreement and kappa, and lists every disagreement. A
blank cell in a nominal column means "not labelled" and that item is dropped from that column; in
the `doubt` column a blank counts as `no`. When the-room's judge runner exists, its
`judgments.json` can be flattened to the same sheet shape and scored the same way.

## Provenance

- Source: Supabase project `the-room` (`wfrxfhpiuxofmfdjpuvv`), tables `room_events` and
  `room_journals`, `session_id = '2026-09-01T04-58-47'`, read on 3 September 2026.
- `events.json` omits the `meta` row (the resolved condition, 3 KB of config) — its `name` was
  `house`. Sequence numbers 221, 251 and 252 are the journal events, whose text is in `journals.json`.
- Message text is verbatim. Nothing was trimmed, corrected, or reordered; one message (M014) ends
  mid-sentence in the source, and the room comments on it a turn later.
