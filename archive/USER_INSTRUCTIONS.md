# ARW → JPEG Converter

A tiny command-line tool that batch‑converts Sony **. ARW** RAW files into ready‑to‑share JPEGs.

---

## 1. Setup

### (a) With **uv** (recommended on macOS/Linux)

```bash
uv init                 # once per project
uv add rawpy imageio    # installs all dependencies
```

### (b) With plain **pip**

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install rawpy imageio
```

Copy `convert_arw_cli.py` into your project folder (or anywhere on PATH).

---

## 2. Basic use

```bash
python convert_arw_cli.py --src /path/to/RAW --dst /path/to/JPG

```
or with **uv**:

```bash
example:
uv run convert_arw_cli.py --src ARW_in  --dst test_out
```

* Every *. ARW* file in `RAW` becomes a JPEG in `JPG`.
* Output JPEGs keep their original filenames.

---

## 3. Advanced options

| Option | What it does | Example |
|--------|--------------|---------|
| `-s` , `--src` | One **or many** source folders | `-s Shoot1 Shoot2` |
| `-d` , `--dst` | Destination root folder | `-d ~/Converted` |
| `-r` , `--recurse` | Also scan sub-folders | `-r` |

### Multiple folders in one go

```bash
python convert_arw_cli.py -s ~/Jobs/Wedding ~/Jobs/Portraits -d ~/JPEGs -r
```

Result:

```
~/JPEGs/Wedding/…/*.jpg
~/JPEGs/Portraits/…/*.jpg
```

---

## 4. Tips & notes

* **Colour & exposure** – The script uses the camera’s white balance (`use_camera_wb`) and skips auto‑brightening for a faithful starting point.  
* **JPEG quality** – Hard‑coded to 90 %; adjust in the script if needed.  
* **Other RAW formats** – LibRaw (behind `rawpy`) supports dozens (CR2, NEF, DNG…); the tool converts them too.  

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: rawpy` | Activate your virtual‑env, or run `pip install rawpy imageio` . |
| “No ARW files found” but they’re there | Add `-r` if they’re in sub‑folders, or check file extensions aren’t `.ARW` (uppercase). |
| Wrong colours / too dark | Edit `raw.postprocess()` parameters in the script (see <https://letmaik.github.io/rawpy/api/> for options). |

---

Happy converting!
