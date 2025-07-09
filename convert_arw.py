import rawpy, imageio.v3 as iio
from pathlib import Path
import sys

src_dir = Path("ARW_in").expanduser().resolve()
dst_dir = Path("JPG_out").expanduser().resolve()
dst_dir.mkdir(parents=True, exist_ok=True)

# Case-insensitive search (recurses into sub-folders too)
arw_files = [*src_dir.rglob("*.arw"), *src_dir.rglob("*.ARW")]
if not arw_files:
    sys.exit(f"No ARW files found in {src_dir}")

for f in arw_files:
    out_path = dst_dir / f.with_suffix(".jpg").name
    print(f"{f.name}  →  {out_path.name}")
    with rawpy.imread(str(f)) as raw:
        rgb = raw.postprocess(use_camera_wb=True, no_auto_bright=True)
    # Pillow plugin guarantees JPEG support
    iio.imwrite(out_path, rgb, plugin="pillow", quality=90)
