"""
EXIF Service - Metadata preservation using exiftool.

Copies all EXIF tags from source ARW to output JPEG to maintain
camera settings, GPS data, timestamps, and other metadata.
"""

from pathlib import Path
import asyncio
import subprocess
from typing import Optional, Tuple


class ExifService:
    """EXIF metadata handler using exiftool."""

    async def copy_exif(self, src: Path, dst: Path) -> Tuple[bool, Optional[str]]:
        """
        Copy EXIF metadata from source to destination asynchronously.

        Args:
            src: Source ARW file with EXIF data
            dst: Destination JPEG file to receive EXIF data

        Returns:
            (success, error_message)
        """
        try:
            # Run exiftool in subprocess
            process = await asyncio.create_subprocess_exec(
                "exiftool",
                "-TagsFromFile",
                str(src),
                "-all:all",  # Copy all tags
                "-unsafe",  # Include maker notes and other non-standard tags
                "-P",  # Preserve file times when possible
                "-overwrite_original",  # Don't create backup
                str(dst),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                return True, None

            error_message = stderr.decode().strip() or "Unknown exiftool error"
            print(f"EXIF copy warning for {dst.name}: {error_message}")
            return False, error_message

        except FileNotFoundError:
            print("Warning: exiftool not found. EXIF data will not be preserved.")
            return False, "exiftool not found"
        except Exception as e:
            error_message = str(e)
            print(f"EXIF copy error for {dst.name}: {error_message}")
            return False, error_message

    async def verify_exif(self, file_path: Path) -> dict:
        """
        Verify EXIF data exists in file (for testing).

        Args:
            file_path: File to check

        Returns:
            Dictionary with basic EXIF info
        """
        try:
            process = await asyncio.create_subprocess_exec(
                "exiftool",
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
