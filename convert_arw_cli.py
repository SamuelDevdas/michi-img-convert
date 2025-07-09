#!/usr/bin/env python3
"""
convert_arw.py – Batch-convert Sony .ARW (or any RAW that LibRaw supports)
to JPEG with minimal fuss.

Usage examples
--------------
# One source folder ➜ one output folder
python convert_arw.py --src ~/Photos/RAW --dst ~/Photos/JPG

# Many source folders ➜ keep originals’ folder names under one output root
python convert_arw.py --src ~/Shoot1 ~/Shoot2 --dst ~/Converted

# Show all options and help
python convert_arw.py --help
"""
from pathlib import Path
import argparse, sys, textwrap

try:
    import rawpy, imageio.v3 as iio
except ImportError as e:             # Tell the user what to do
    sys.exit(
        "❌ Missing dependency!  Run:\n\n"
        "   pip install rawpy imageio\n\n"
        "or, if you use uv:\n\n"
        "   uv add rawpy imageio\n"
    )

def convert_one(src_file: Path, dst_file: Path, quality: int = 90) -> None:
    """Convert a single RAW file to JPEG."""
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    with rawpy.imread(str(src_file)) as raw:
        rgb = raw.postprocess(use_camera_wb=True, no_auto_bright=True)
    iio.imwrite(dst_file, rgb, plugin="pillow", quality=quality)

def convert_folder(src_dir: Path, dst_dir_root: Path, recurse: bool) -> int:
    """Convert all RAW files in *src_dir*; returns #converted."""
    globber = src_dir.rglob if recurse else src_dir.glob
    raw_files = [*globber("*.arw"), *globber("*.ARW")]
    if not raw_files:
        print(f"• No ARW files found in {src_dir}")
        return 0

    converted = 0
    for f in raw_files:
        # Keep original directory structure under dst_dir_root/<src_dir.name>/
        relative = f.relative_to(src_dir).with_suffix(".jpg")
        out_file = dst_dir_root / src_dir.name / relative
        print(f"{f} -> {out_file}")
        convert_one(f, out_file)
        converted += 1
    return converted

def main(argv=None) -> None:
    p = argparse.ArgumentParser(
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description="Batch-convert Sony .ARW RAW files to JPEG.",
        epilog=textwrap.dedent("""\
            EXAMPLES
              Convert one folder:
                python convert_arw.py -s ./ARW_in -d ./JPG_out

              Convert multiple folders, keep names:
                python convert_arw.py -s Shoot1 Shoot2 -d ./Converted -r
        """),
    )
    p.add_argument("-s", "--src", required=True, nargs="+",
                   type=Path, help="One or more source folders")
    p.add_argument("-d", "--dst", required=True, type=Path,
                   help="Destination root folder")
    p.add_argument("-r", "--recurse", action="store_true",
                   help="Recurse into sub-folders (default: off)")
    args = p.parse_args(argv)

    total = 0
    for src in args.src:
        if not src.exists():
            print(f"❌ Source not found: {src}")
            continue
        total += convert_folder(src, args.dst, args.recurse)

    print(f"\n✓ Done!  {total} file(s) converted." if total else
          "\nNothing converted.")

if __name__ == "__main__":
    main()
