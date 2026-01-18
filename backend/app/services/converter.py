"""
Converter Service - ARW to JPEG conversion with atomic writes.

Uses rawpy for RAW decoding and imageio for JPEG encoding.
Implements atomic write pattern to prevent corruption on NAS.
"""

from pathlib import Path
from typing import Optional, Dict, Any
import os
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor
import tempfile
import shutil

try:
    import rawpy
    from PIL import Image, ImageFilter, ImageEnhance
except ImportError as e:
    raise ImportError("Missing dependencies. Install with: uv add rawpy imageio pillow") from e


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
        self.jpeg_quality_default = int(os.getenv("SPECTRUM_JPEG_QUALITY", "95"))
        self.enable_sharpen = os.getenv("SPECTRUM_SHARPEN", "1") != "0"
        self.sharpen_radius = float(os.getenv("SPECTRUM_SHARPEN_RADIUS", "1.2"))
        self.sharpen_percent = int(os.getenv("SPECTRUM_SHARPEN_PERCENT", "120"))
        self.sharpen_threshold = int(os.getenv("SPECTRUM_SHARPEN_THRESHOLD", "3"))
        self.auto_bright = os.getenv("SPECTRUM_AUTO_BRIGHT", "1") != "0"
        self.default_preset = os.getenv("SPECTRUM_PRESET", "standard").lower()

    async def convert_file(
        self,
        src: Path,
        dst: Path,
        quality: Optional[int] = None,
        preset: Optional[str] = None,
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
            self.executor, self._convert_sync, src, dst, quality, preset
        )

    def _convert_sync(
        self,
        src: Path,
        dst: Path,
        quality: Optional[int],
        preset: Optional[str],
    ) -> ConversionResult:
        """Synchronous implementation of ARW to JPEG conversion."""
        try:
            final_quality = quality if quality is not None else self.jpeg_quality_default
            final_quality = max(1, min(100, int(final_quality)))
            preset_config = self._resolve_preset(preset)

            # Ensure output directory exists
            dst.parent.mkdir(parents=True, exist_ok=True)

            # Create temporary file for atomic write
            temp_fd, temp_path = tempfile.mkstemp(
                suffix=".jpg", dir=dst.parent, prefix=".tmp_"
            )

            try:
                # Convert ARW to RGB array using rawpy
                with rawpy.imread(str(src)) as raw:
                    raw_kwargs = {
                        "use_camera_wb": True,
                        "no_auto_bright": not preset_config["auto_bright"],
                        "output_bps": 8,
                        "half_size": False,
                        "output_color": rawpy.ColorSpace.sRGB,
                        "noise_thr": preset_config["noise_thr"],
                        "median_filter_passes": preset_config["median_filter_passes"],
                    }

                    fbdd_mode = self._fbdd_mode(preset_config["fbdd_noise_reduction"])
                    if fbdd_mode is not None:
                        raw_kwargs["fbdd_noise_reduction"] = fbdd_mode

                    rgb = raw.postprocess(**raw_kwargs)

                # Optional enhancement: tonal and color adjustments
                image = Image.fromarray(rgb)
                if preset_config["contrast"] != 1.0:
                    image = ImageEnhance.Contrast(image).enhance(
                        preset_config["contrast"]
                    )
                if preset_config["color"] != 1.0:
                    image = ImageEnhance.Color(image).enhance(preset_config["color"])
                if preset_config["brightness"] != 1.0:
                    image = ImageEnhance.Brightness(image).enhance(
                        preset_config["brightness"]
                    )

                # Optional enhancement: light sharpening for clarity
                if self.enable_sharpen and preset_config["sharpen"]["enabled"]:
                    image = image.filter(
                        ImageFilter.UnsharpMask(
                            radius=preset_config["sharpen"]["radius"],
                            percent=preset_config["sharpen"]["percent"],
                            threshold=preset_config["sharpen"]["threshold"],
                        )
                    )

                # Write JPEG to temporary file (highest quality, no resize)
                image.save(
                    temp_path,
                    format="JPEG",
                    quality=final_quality,
                    subsampling=0,
                    optimize=False,
                )

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

    def _resolve_preset(self, preset: Optional[str]) -> Dict[str, Any]:
        presets: Dict[str, Dict[str, Any]] = {
            "neutral": {
                "auto_bright": False,
                "contrast": 1.0,
                "color": 1.0,
                "brightness": 1.0,
                "noise_thr": 0,
                "median_filter_passes": 0,
                "fbdd_noise_reduction": "off",
                "sharpen": {"enabled": True, "radius": 0.8, "percent": 90, "threshold": 4},
            },
            "standard": {
                "auto_bright": True,
                "contrast": 1.05,
                "color": 1.05,
                "brightness": 1.0,
                "noise_thr": 4,
                "median_filter_passes": 0,
                "fbdd_noise_reduction": "off",
                "sharpen": {"enabled": True, "radius": 1.0, "percent": 120, "threshold": 3},
            },
            "vivid": {
                "auto_bright": True,
                "contrast": 1.12,
                "color": 1.12,
                "brightness": 1.0,
                "noise_thr": 2,
                "median_filter_passes": 0,
                "fbdd_noise_reduction": "off",
                "sharpen": {"enabled": True, "radius": 1.1, "percent": 150, "threshold": 2},
            },
            "clean": {
                "auto_bright": True,
                "contrast": 1.0,
                "color": 1.0,
                "brightness": 1.0,
                "noise_thr": 10,
                "median_filter_passes": 1,
                "fbdd_noise_reduction": "full",
                "sharpen": {"enabled": True, "radius": 0.9, "percent": 90, "threshold": 4},
            },
        }

        preset_key = (preset or self.default_preset or "standard").lower()
        return presets.get(preset_key, presets["standard"])

    def _fbdd_mode(self, value: str) -> Optional["rawpy.FBDDNoiseReductionMode"]:
        if not hasattr(rawpy, "FBDDNoiseReductionMode"):
            return None
        mode = value.lower()
        enum = rawpy.FBDDNoiseReductionMode
        if mode == "full" and hasattr(enum, "Full"):
            return enum.Full
        if mode == "light" and hasattr(enum, "Light"):
            return enum.Light
        if mode == "off" and hasattr(enum, "Off"):
            return enum.Off
        return None
