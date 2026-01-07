"""
EXIF Service - Metadata preservation using exiftool.

Copies all EXIF tags from source ARW to output JPEG to maintain
camera settings, GPS data, timestamps, and other metadata.
"""

from pathlib import Path
import asyncio
import subprocess
from typing import Optional


class ExifService:
    """EXIF metadata handler using exiftool."""

    async def copy_exif(self, src: Path, dst: Path) -> bool:
        """
        Copy EXIF metadata from source to destination asynchronously.

        Args:
            src: Source ARW file with EXIF data
            dst: Destination JPEG file to receive EXIF data

        Returns:
            True if successful, False otherwise
        """
        try:
            # Run exiftool in subprocess
            process = await asyncio.create_subprocess_exec(
                "exiftool",
                "-TagsFromFile",
                str(src),
                "-all:all",  # Copy all tags
                "-overwrite_original",  # Don't create backup
                str(dst),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                return True
            else:
                # Log error but don't fail the conversion
                print(f"EXIF copy warning for {dst.name}: {stderr.decode()}")
                return False

        except FileNotFoundError:
            print("Warning: exiftool not found. EXIF data will not be preserved.")
            return False
        except Exception as e:
            print(f"EXIF copy error for {dst.name}: {str(e)}")
            return False

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
