# Shared datasets — Lab 1

Pick **one** theme file for the training exercise (A7). All three have the **same
structure**, so the notebook code doesn't change — only the vibe of the control vector does.

## Theme file structure
```json
{
  "theme": "playful_vs_serious",
  "template": "Act as if you're extremely {persona}.",
  "positive_personas": ["playful", "lighthearted"],
  "negative_personas": ["serious", "stern"],
  "suffix_file": "all_truncated_outputs.json",
  "suggested_prompt": "Give me a one-sentence pitch for a TV show."
}
```
`make_dataset` (in the notebook) formats the template with each persona and pairs it with
every suffix to build the positive/negative contrast set repeng trains on.

## Files
- `playful_vs_serious.json`, `formal_vs_casual.json`, `optimistic_vs_pessimistic.json` — the three themes.
- `all_truncated_outputs.json` — the generic suffix corpus (582 short text fragments) all themes share.

## Credit
`all_truncated_outputs.json` is taken unmodified from **repeng** by Theia Vogel (vgel):
https://github.com/vgel/repeng (notebooks/data/). All credit to the original author.
