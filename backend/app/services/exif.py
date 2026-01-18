"""
EXIF Service - Metadata preservation using exiftool.

Copies all EXIF tags from source ARW to output JPEG to maintain
camera settings, GPS data, timestamps, and other metadata.
"""

from pathlib import Path
import asyncio
import shutil
from typing import Optional, Tuple


class ExifService:
    """EXIF metadata handler using exiftool."""

    def __init__(self):
        """Initialize and verify exiftool is available."""
        self._exiftool_path = shutil.which("exiftool")
        if self._exiftool_path:
            print(f"[EXIF] Found exiftool at: {self._exiftool_path}", flush=True)
        else:
            print("[EXIF] WARNING: exiftool not found in PATH. Metadata will not be preserved.", flush=True)

    async def copy_exif(self, src: Path, dst: Path) -> Tuple[bool, Optional[str]]:
        """
        Copy EXIF metadata from source to destination asynchronously.

        Uses exiftool with explicit tag group copying to ensure metadata
        transfers correctly from RAW formats (ARW) to JPEG.

        Args:
            src: Source ARW file with EXIF data
            dst: Destination JPEG file to receive EXIF data

        Returns:
            (success, error_message)
        """
        try:
            # Check if exiftool is available
            if not self._exiftool_path:
                return False, "exiftool not installed"

            # Run exiftool with robust settings for RAW to JPEG metadata transfer
            #
            # For cross-format copies (ARW -> JPEG), we use:
            # -all: Copy all writable tags (exiftool handles group mapping automatically)
            # -unsafe: Include MakerNotes and other non-standard/proprietary tags
            # -m: Ignore minor errors (important for cross-format copies where
            #     some tags may not be writable in the destination format)
            # -overwrite_original: Don't create backup files
            #
            # Note: We use -all (not -all:all) because -all copies all available
            # tags to their appropriate groups in the destination, while -all:all
            # tries to preserve source group structure which may not work for
            # cross-format copies.
            process = await asyncio.create_subprocess_exec(
                self._exiftool_path,
                "-TagsFromFile",
                str(src),
                "-all",  # Copy all writable metadata
                "-unsafe",  # Include MakerNotes and proprietary tags
                "-m",  # Ignore minor errors/warnings
                "-overwrite_original",  # Don't create backup
                str(dst),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()
            stdout_text = stdout.decode().strip()
            stderr_text = stderr.decode().strip()

            # Log the actual exiftool output for debugging
            if stdout_text:
                print(f"[EXIF] {dst.name}: {stdout_text}", flush=True)
            if stderr_text:
                print(f"[EXIF] {dst.name} stderr: {stderr_text}", flush=True)

            # exiftool returns 0 on success, 1 on warnings, 2 on errors
            # We accept 0 and 1 as success (warnings are ok for cross-format copies)
            if process.returncode <= 1:
                # Check if it actually updated the file
                if "image files updated" in stdout_text:
                    return True, None
                # "0 image files updated" means nothing was written - this is a problem
                if "0 image files updated" in stdout_text:
                    print(f"[EXIF] Warning: No metadata written to {dst.name}", flush=True)
                    return False, "No metadata was written"
                # Other success cases
                return True, None

            error_message = stderr_text or stdout_text or "Unknown exiftool error"
            print(f"[EXIF] Failed for {dst.name} (code {process.returncode}): {error_message}", flush=True)
            return False, error_message

        except FileNotFoundError:
            print("[EXIF] Warning: exiftool not found. EXIF data will not be preserved.", flush=True)
            return False, "exiftool not found"
        except Exception as e:
            error_message = str(e)
            print(f"[EXIF] Copy error for {dst.name}: {error_message}", flush=True)
            return False, error_message

    async def verify_exif(self, file_path: Path) -> dict:
        """
        Verify EXIF data exists in file (for testing).

        Args:
            file_path: File to check

        Returns:
            Dictionary with basic EXIF info
        """
        if not self._exiftool_path:
            return {}

        try:
            process = await asyncio.create_subprocess_exec(
                self._exiftool_path,
                "-json",
                str(file_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                import json

                data = json.loads(stdout.decode())
                return data[0] if data else {}
            else:
                return {}

        except Exception as e:
            print(f"EXIF verification error: {str(e)}")
            return {}

    async def get_key_metadata(self, file_path: Path) -> dict:
        """
        Extract key metadata fields that users typically want to preserve.

        Returns a dictionary with camera, GPS, and date information.
        """
        if not self._exiftool_path:
            return {"error": "exiftool not available"}

        try:
            # Extract the most important metadata fields
            process = await asyncio.create_subprocess_exec(
                self._exiftool_path,
                "-json",
                "-Make",
                "-Model",
                "-LensModel",
                "-DateTimeOriginal",
                "-CreateDate",
                "-GPSLatitude",
                "-GPSLongitude",
                "-GPSAltitude",
                "-ISO",
                "-ExposureTime",
                "-FNumber",
                "-FocalLength",
                str(file_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                import json
                data = json.loads(stdout.decode())
                return data[0] if data else {}
            else:
                return {"error": stderr.decode().strip()}

        except Exception as e:
            return {"error": str(e)}
