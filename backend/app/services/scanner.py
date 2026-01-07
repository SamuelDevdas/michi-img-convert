"""
Scanner Service - Recursive ARW file discovery with skip-existing logic.

This service provides async directory traversal to locate ARW files,
optimized for NAS environments with network latency considerations.
"""

from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor


@dataclass
class FileInfo:
    """Metadata for a discovered ARW file."""

    path: str
    size: int
    modified_time: float
    already_converted: bool = False


class ScannerService:
    """Async file system scanner for ARW files."""

    def __init__(self, executor: Optional[ThreadPoolExecutor] = None):
        """Initialize scanner with optional thread pool for I/O operations."""
        self.executor = executor or ThreadPoolExecutor(max_workers=4)

    async def scan_directory(
        self, path: str, recursive: bool = True, output_subdir: str = "converted"
    ) -> List[FileInfo]:
        """
        Scan directory for ARW files asynchronously.

        Args:
            path: Directory path to scan
            recursive: Whether to scan subdirectories
            output_subdir: Name of the output folder to check for existing conversions

        Returns:
            List of FileInfo objects for discovered ARW files
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self._scan_sync, path, recursive, output_subdir
        )

    def _scan_sync(
        self, path: str, recursive: bool, output_subdir: str
    ) -> List[FileInfo]:
        """Synchronous implementation of directory scanning."""
        source_dir = Path(path)

        if not source_dir.exists():
            raise FileNotFoundError(f"Directory not found: {path}")

        if not source_dir.is_dir():
            raise NotADirectoryError(f"Path is not a directory: {path}")

        # Determine glob pattern
        globber = source_dir.rglob if recursive else source_dir.glob

        # Find all ARW files (case-insensitive)
        arw_files = []
        for pattern in ["*.arw", "*.ARW"]:
            arw_files.extend(globber(pattern))

        # Build FileInfo list with conversion status
        results = []
        for arw_file in arw_files:
            # Check if already converted
            relative_path = arw_file.relative_to(source_dir)
            output_path = source_dir / output_subdir / relative_path.with_suffix(".jpg")

            file_info = FileInfo(
                path=str(arw_file),
                size=arw_file.stat().st_size,
                modified_time=arw_file.stat().st_mtime,
                already_converted=output_path.exists(),
            )
            results.append(file_info)

        return results

    def get_summary(self, files: List[FileInfo]) -> dict:
        """Generate summary statistics for scanned files."""
        total = len(files)
        already_converted = sum(1 for f in files if f.already_converted)
        pending = total - already_converted
        total_size = sum(f.size for f in files if not f.already_converted)

        return {
            "total_files": total,
            "already_converted": already_converted,
            "pending_conversion": pending,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
        }
