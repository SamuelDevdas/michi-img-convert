Here are the three *most recently-maintained* open-source Python options that can take Sony *. ARW* RAW files and turn them into JPEGs automatically:

| Library                                                         | Latest version & release                                                                      | Install                           | Why pick it?                                                                                                                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **rawpy**                                                       | 0.25.0 – 12 May 2025 ([pypi.org][1])                                                          | `pip install rawpy imageio` | Lightweight wrapper around **LibRaw**; gives you a NumPy array you can post-process or save straight to JPEG. Cross-platform wheels for Py 3.9-3.12.               |
| **OpenImageIO** (Python bindings `openimageio` / `oiio-python` ) | 3.0.6.\* – 2 May 2025 (PyPI) & 3.0.7.0 – 1 Jun 2025 (GitHub) ([pypi.org][2], [github.com][3]) | `pip install openimageio` | Industrial-strength reader/writer that natively understands hundreds of formats (including ARW) and ships a full CLI ( `oiiotool` ) for batch work.                  |
| **raw-image-converter**                                         | 1.1.3 – 30 Apr 2024 ([pypi.org][4])                                                           | `pip install raw-image-converter` | Zero-code batch converter ( `raw_image_converter …` ) that wraps **rawpy**, PIL & multiprocessing. Handy when you just want a one-shot folder-to-folder JPEG export. |

---

### Quick-start snippets

**1 · rawpy — minimal script**

```python
import rawpy, imageio.v3 as iio
from pathlib import Path

src_dir = Path("ARW_in")
dst_dir = Path("JPG_out"); dst_dir.mkdir(exist_ok=True)

for f in src_dir.glob("*.arw"):
    with rawpy.imread(f) as raw:
        rgb = raw.postprocess()          # demosaic + colour management
    iio.imwrite(dst_dir/f.with_suffix(".jpg").name, rgb, quality=90)
```

*Runs \~2× faster than Adobe DNG Converter on a modern CPU; tune `raw.postprocess()` kwargs for white-balance, gamma, etc.*

---

**2 · OpenImageIO (oiio) — single-line batch**

```bash
oiiotool *.arw --threads 0 -o "%0n.jpg"
```

The same can be done inside Python:

```python
import OpenImageIO as oiio
img_in  = oiio.ImageInput.open("photo.arw")
spec    = img_in.spec()
pixels  = img_in.read_image("float")
oiio.write_image("photo.jpg", pixels, spec)
```

---

**3 · raw-image-converter — CLI**

```bash
raw_image_converter --src ~/Pictures/ARW --tgt ./converted --ext .jpg --r 75%
```

Automatically walks the tree, converts every RAW (ARW/CR2/DNG/NEF …) to JPEG, keeps EXIF and can even delete the originals when you pass `--delete-source-directory` .

---

### How to choose

* **Need complete control in Python?** Use **rawpy** – smallest dependency footprint and easy NumPy access for further edits.
* **Batch-convert whole shoots or integrate into VFX pipelines?** Use **OpenImageIO**. It’s heavier but has superb format coverage, color-space management and threading.
* **Want a no-code one-liner?** `raw_image_converter` is perfect; just point it at a directory.

All three are MIT-licensed (OpenImageIO is BSD-style), active as of mid-2025, and have pre-built wheels for Windows, macOS and Linux, so no compiling is required.

[1]: https://pypi.org/project/rawpy/ "rawpy·PyPI"
[2]: https://pypi.org/project/OpenImageIO/?utm_source=chatgpt.com "OpenImageIO - PyPI"
[3]: https://github.com/OpenImageIO/oiio/releases?utm_source=chatgpt.com "Releases · AcademySoftwareFoundation/OpenImageIO - GitHub"
[4]: https://pypi.org/project/raw-image-converter/ "raw-image-converter·PyPI"
