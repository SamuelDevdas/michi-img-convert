"""
Converter Service - ARW to JPEG conversion with atomic writes.

Uses rawpy for RAW decoding and imageio for JPEG encoding.
Implements atomic write pattern to prevent corruption on NAS.
"""

from pathlib import Path
from typing import Optional
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor
import tempfile
import shutil

try:
    import rawpy
    import imageio.v3 as iio
except ImportError as e:
    raise ImportError("Missing dependencies. Install with: uv add rawpy imageio") from e


@dataclass
class ConversionResult:
    """Result of a single file conversion."""

    src_path: str
    dst_path: str
    success: bool
    error: Optional[str] = None
    size_bytes: Optional[int] = None


class ConverterService:
    """ARW to JPEG converter with atomic writes."""

    def __init__(self, executor: Optional[ThreadPoolExecutor] = None):
        """Initialize converter with optional thread pool."""
        self.executor = executor or ThreadPoolExecutor(max_workers=2)

    async def convert_file(
        self, src: Path, dst: Path, quality: int = 90
    ) -> ConversionResult:
        """
        Convert ARW file to JPEG asynchronously.

        Args:
            src: Source ARW file path
            dst: Destination JPEG file path
            quality: JPEG quality (1-100)

        Returns:
            ConversionResult with success status and metadata
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self._convert_sync, src, dst, quality
        )

    def _convert_sync(self, src: Path, dst: Path, quality: int) -> ConversionResult:
        """Synchronous implementation of ARW to JPEG conversion."""
        try:
            # Ensure output directory exists
            dst.parent.mkdir(parents=True, exist_ok=True)

            # Create temporary file for atomic write
            temp_fd, temp_path = tempfile.mkstemp(
                suffix=".jpg", dir=dst.parent, prefix=".tmp_"
            )

            try:
                # Convert ARW to RGB array using rawpy
                with rawpy.imread(str(src)) as raw:
                    rgb = raw.postprocess(
                        use_camera_wb=True,  # Use camera white balance
                        no_auto_bright=True,  # Disable auto-brightness
                        output_bps=8,  # 8-bit output
                    )

                # Write JPEG to temporary file
                iio.imwrite(temp_path, rgb, plugin="pillow", quality=quality)

                # Atomic rename: temp → final
                shutil.move(temp_path, dst)

                return ConversionResult(
                    src_path=str(src),
                    dst_path=str(dst),
                    success=True,
                    size_bytes=dst.stat().st_size,
                )

            finally:
                # Clean up temp file if it still exists
                try:
                    Path(temp_path).unlink(missing_ok=True)
                except:
                    pass

        except Exception as e:
            return ConversionResult(
                src_path=str(src), dst_path=str(dst), success=False, error=str(e)
            )
