# repeng — offline wheel set (for Kaggle, no internet)

Two pure-Python wheels (`py3-none-any`, so they work on any OS/Python ≥3.10):

| Wheel | Version | Why it's here |
|---|---|---|
| `repeng-0.5.0-py3-none-any.whl` | 0.5.0 | The library we're teaching |
| `gguf-0.17.1-py3-none-any.whl` | 0.17.1 | repeng's only dependency **not** preinstalled on Kaggle |

repeng's other deps — `numpy`, `scikit-learn`, `torch`, `transformers`, `tqdm` (plus gguf's `pyyaml`/`tqdm`) — are already in Kaggle's base image, so they don't need bundling.

## Use in a Kaggle notebook (internet turned OFF)

1. Create a Kaggle **Dataset**, upload both `.whl` files. Give it a slug, e.g. `repeng-offline-wheels`.
2. In the notebook: **Add Data → your dataset**. It mounts at `/kaggle/input/repeng-offline-wheels/`.
3. First cell:

   ```python
   !pip install --no-index --find-links=/kaggle/input/repeng-offline-wheels repeng
   ```

   `--no-index` = don't touch PyPI; `--find-links` = install only from the local wheels. pip pulls `gguf` from the same folder and treats the rest as already-satisfied.

   If Kaggle's preinstalled versions ever cause a resolver complaint, fall back to:

   ```python
   !pip install --no-index --find-links=/kaggle/input/repeng-offline-wheels --no-deps repeng gguf
   ```

4. Verify:

   ```python
   import repeng
   from repeng import ControlVector, ControlModel, DatasetEntry
   ```

## Credit blurb for the dataset description

> Offline build wheels for **repeng** (representation engineering / control vectors) by
> Theia Vogel (vgel) — https://github.com/vgel/repeng. Repackaged unmodified for offline
> install in Kaggle notebooks. All credit to the original author; see the repo for license
> and docs.

## Rebuild note

These were built offline (no PyPI access): `repeng` assembled from source in the repo, `gguf`
repackaged from the project `.venv`. Every `gguf` file is byte-identical to the installed
package, and both wheels install and import cleanly. When you have internet, the canonical
way to regenerate is `uv build --wheel` (repeng) and `pip download gguf==0.17.1` (gguf).
