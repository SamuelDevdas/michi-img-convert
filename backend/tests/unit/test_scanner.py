"""
Unit tests for scanner service.

Tests file discovery, filtering, and summary generation.
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock
import tempfile
import os

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.services.scanner import ScannerService, FileInfo


class TestScannerService:
    """Tests for ScannerService class."""

    @pytest.fixture
    def scanner(self):
        return ScannerService()

    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory with test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test ARW files (empty, just for path testing)
            (Path(tmpdir) / "test1.ARW").touch()
            (Path(tmpdir) / "test2.arw").touch()
            (Path(tmpdir) / "other.jpg").touch()

            # Create nested directory
            nested = Path(tmpdir) / "nested"
            nested.mkdir()
            (nested / "test3.ARW").touch()

            # Create converted directory
            converted = Path(tmpdir) / "converted"
            converted.mkdir()
            (converted / "test1.jpg").touch()

            yield tmpdir


class TestFileInfo:
    """Tests for FileInfo dataclass."""

    def test_file_info_creation(self):
        info = FileInfo(
            path="/test/file.ARW",
            size=1024,
            modified_time=1234567890.0,
            already_converted=False
        )
        assert info.path == "/test/file.ARW"
        assert info.size == 1024
        assert info.modified_time == 1234567890.0
        assert info.already_converted is False


class TestScannerSummary:
    """Tests for summary generation."""

    @pytest.fixture
    def scanner(self):
        return ScannerService()

    def test_empty_files_summary(self, scanner):
        summary = scanner.get_summary([])
        assert summary["total_files"] == 0
        assert summary["already_converted"] == 0
        assert summary["pending_conversion"] == 0
        assert summary["total_size_mb"] == 0.0

    def test_mixed_files_summary(self, scanner):
        files = [
            FileInfo("/test/a.ARW", 1024 * 1024, 1234567890.0, False),  # 1 MB, pending
            FileInfo("/test/b.ARW", 2 * 1024 * 1024, 1234567890.0, True),  # 2 MB, converted
            FileInfo("/test/c.ARW", 512 * 1024, 1234567890.0, False),  # 0.5 MB, pending
        ]
        summary = scanner.get_summary(files)

        assert summary["total_files"] == 3
        assert summary["already_converted"] == 1
        assert summary["pending_conversion"] == 2
        # total_size only counts pending files (1MB + 0.5MB = 1.5MB)
        assert summary["total_size_mb"] == pytest.approx(1.5, rel=0.1)

    def test_all_converted_summary(self, scanner):
        files = [
            FileInfo("/test/a.ARW", 1024 * 1024, 1234567890.0, True),
            FileInfo("/test/b.ARW", 1024 * 1024, 1234567890.0, True),
        ]
        summary = scanner.get_summary(files)

        assert summary["total_files"] == 2
        assert summary["already_converted"] == 2
        assert summary["pending_conversion"] == 0


class TestScanDirectoryAsync:
    """Tests for async scan_directory method."""

    @pytest.fixture
    def scanner(self):
        return ScannerService()

    @pytest.mark.asyncio
    async def test_scan_nonexistent_raises(self, scanner):
        with pytest.raises(FileNotFoundError):
            await scanner.scan_directory("/nonexistent/path/12345")

    @pytest.mark.asyncio
    async def test_scan_file_raises(self, scanner, tmp_path):
        test_file = tmp_path / "test.txt"
        test_file.touch()

        with pytest.raises(NotADirectoryError):
            await scanner.scan_directory(str(test_file))

    @pytest.mark.asyncio
    async def test_scan_empty_directory(self, scanner, tmp_path):
        files = await scanner.scan_directory(str(tmp_path))
        assert files == []

    @pytest.mark.asyncio
    async def test_scan_finds_arw_files(self, scanner, tmp_path):
        # Create test ARW files
        (tmp_path / "photo1.ARW").write_bytes(b"fake arw content")
        (tmp_path / "photo2.arw").write_bytes(b"more fake content")
        (tmp_path / "document.pdf").touch()

        files = await scanner.scan_directory(str(tmp_path))

        assert len(files) == 2
        paths = [f.path for f in files]
        assert any("photo1.ARW" in p for p in paths)
        assert any("photo2.arw" in p for p in paths)

    @pytest.mark.asyncio
    async def test_scan_recursive(self, scanner, tmp_path):
        # Create nested structure
        (tmp_path / "root.ARW").touch()
        nested = tmp_path / "subfolder"
        nested.mkdir()
        (nested / "nested.ARW").touch()

        files = await scanner.scan_directory(str(tmp_path), recursive=True)

        assert len(files) == 2

    @pytest.mark.asyncio
    async def test_scan_non_recursive(self, scanner, tmp_path):
        # Create nested structure
        (tmp_path / "root.ARW").touch()
        nested = tmp_path / "subfolder"
        nested.mkdir()
        (nested / "nested.ARW").touch()

        files = await scanner.scan_directory(str(tmp_path), recursive=False)

        assert len(files) == 1

    @pytest.mark.asyncio
    async def test_detects_already_converted(self, scanner, tmp_path):
        # Create ARW and corresponding converted JPEG
        (tmp_path / "photo.ARW").touch()
        converted = tmp_path / "converted"
        converted.mkdir()
        (converted / "photo.jpg").touch()

        files = await scanner.scan_directory(str(tmp_path), output_subdir="converted")

        assert len(files) == 1
        assert files[0].already_converted is True
