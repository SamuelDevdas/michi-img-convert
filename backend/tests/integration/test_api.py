"""
Integration tests for Spectrum API.

Tests full API endpoints using FastAPI TestClient.
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock
import tempfile
import json

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create FastAPI test client."""
    return TestClient(app)


class TestRootEndpoint:
    """Tests for root endpoint."""

    def test_root_returns_api_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Spectrum API"
        assert data["version"] == "2.0.0"
        assert data["status"] == "Ready"


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_returns_healthy(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestBrowseEndpoint:
    """Tests for browse directory endpoint."""

    def test_browse_root_returns_smart_roots(self, client):
        response = client.get("/api/browse")
        assert response.status_code == 200
        data = response.json()
        assert "current" in data
        assert "directories" in data
        assert isinstance(data["directories"], list)

    def test_browse_nonexistent_path_returns_404(self, client):
        response = client.get("/api/browse?path=/nonexistent/path/12345")
        assert response.status_code == 404

    def test_browse_unc_path_returns_404_with_message(self, client):
        response = client.get("/api/browse?path=\\\\NAS\\Photos")
        assert response.status_code == 404
        assert "UNC" in response.json()["detail"] or "map" in response.json()["detail"].lower()

    def test_browse_valid_directory(self, client, tmp_path):
        # Create test directories
        (tmp_path / "subdir1").mkdir()
        (tmp_path / "subdir2").mkdir()
        (tmp_path / "file.txt").touch()

        response = client.get(f"/api/browse?path={tmp_path}")
        assert response.status_code == 200
        data = response.json()

        assert data["current"] == str(tmp_path)
        assert len(data["directories"]) == 2  # Only directories, not files


class TestScanEndpoint:
    """Tests for scan directory endpoint."""

    def test_scan_nonexistent_returns_404(self, client):
        response = client.post(
            "/api/scan",
            json={"path": "/nonexistent/path/12345"}
        )
        assert response.status_code == 404

    def test_scan_empty_directory(self, client, tmp_path):
        response = client.post(
            "/api/scan",
            json={"path": str(tmp_path)}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["total_files"] == 0
        assert data["already_converted"] == 0
        assert data["pending_conversion"] == 0

    def test_scan_finds_arw_files(self, client, tmp_path):
        # Create test files
        (tmp_path / "photo1.ARW").write_bytes(b"fake arw content")
        (tmp_path / "photo2.arw").write_bytes(b"more content")
        (tmp_path / "document.pdf").touch()

        response = client.post(
            "/api/scan",
            json={"path": str(tmp_path)}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["total_files"] == 2
        assert len(data["files"]) == 2

    def test_scan_detects_converted_files(self, client, tmp_path):
        # Create ARW and converted JPEG
        (tmp_path / "photo.ARW").write_bytes(b"fake content")
        converted = tmp_path / "converted"
        converted.mkdir()
        (converted / "photo.jpg").touch()

        response = client.post(
            "/api/scan",
            json={"path": str(tmp_path), "output_subdir": "converted"}
        )
        assert response.status_code == 200
        data = response.json()

        assert data["total_files"] == 1
        assert data["already_converted"] == 1
        assert data["pending_conversion"] == 0


class TestDrivesEndpoint:
    """Tests for drives detection endpoint."""

    def test_drives_returns_list(self, client):
        response = client.get("/api/drives")
        assert response.status_code == 200
        data = response.json()

        assert "drives" in data
        assert "platform" in data
        assert isinstance(data["drives"], list)

    def test_drives_includes_platform(self, client):
        response = client.get("/api/drives")
        data = response.json()

        assert data["platform"] in ["windows", "macos", "linux"]


class TestMetadataEndpoint:
    """Tests for metadata endpoint."""

    def test_metadata_nonexistent_returns_404(self, client):
        response = client.get("/api/metadata?path=/nonexistent/file.jpg")
        assert response.status_code == 404

    def test_metadata_directory_returns_400(self, client, tmp_path):
        response = client.get(f"/api/metadata?path={tmp_path}")
        assert response.status_code == 400


class TestConvertEndpoint:
    """Tests for convert endpoint."""

    def test_convert_no_files_returns_404(self, client, tmp_path):
        response = client.post(
            "/api/convert",
            json={
                "files": [str(tmp_path / "nonexistent.ARW")],
                "output_dir": str(tmp_path / "converted")
            }
        )
        assert response.status_code == 404

    def test_convert_empty_list_returns_error(self, client, tmp_path):
        response = client.post(
            "/api/convert",
            json={
                "files": [],
                "output_dir": str(tmp_path / "converted")
            }
        )
        # Empty list should return 404 (no accessible files)
        assert response.status_code == 404


class TestConvertStreamEndpoint:
    """Tests for streaming convert endpoint."""

    def test_stream_no_files_returns_error(self, client, tmp_path):
        response = client.post(
            "/api/convert/stream",
            json={
                "files": [str(tmp_path / "nonexistent.ARW")],
                "output_dir": str(tmp_path / "converted")
            }
        )
        # Should return NDJSON stream
        assert response.status_code == 200
        # First line should be error or start
        lines = response.text.strip().split("\n")
        assert len(lines) >= 1


class TestReviewEndpoint:
    """Tests for review endpoint."""

    def test_review_nonexistent_source_returns_404(self, client):
        response = client.post(
            "/api/review",
            json={
                "source_path": "/nonexistent/path",
                "output_dir": "/nonexistent/output"
            }
        )
        assert response.status_code == 404

    def test_review_empty_directory(self, client, tmp_path):
        converted = tmp_path / "converted"
        converted.mkdir()

        response = client.post(
            "/api/review",
            json={
                "source_path": str(tmp_path),
                "output_dir": str(converted)
            }
        )
        assert response.status_code == 200
        data = response.json()

        assert data["total_original"] == 0
        assert data["total_converted"] == 0
        assert data["pairs"] == []

    def test_review_finds_pairs(self, client, tmp_path):
        # Create source ARW
        (tmp_path / "photo.ARW").touch()

        # Create converted JPEG
        converted = tmp_path / "converted"
        converted.mkdir()
        (converted / "photo.jpg").touch()

        response = client.post(
            "/api/review",
            json={
                "source_path": str(tmp_path),
                "output_dir": str(converted)
            }
        )
        assert response.status_code == 200
        data = response.json()

        assert data["total_original"] == 1
        assert data["total_converted"] == 1
        assert len(data["pairs"]) == 1


class TestPreviewEndpoint:
    """Tests for preview endpoint."""

    def test_preview_nonexistent_returns_404(self, client):
        response = client.get("/api/preview?path=/nonexistent/file.arw")
        assert response.status_code == 404

    def test_preview_unsupported_format_returns_415(self, client, tmp_path):
        test_file = tmp_path / "document.pdf"
        test_file.touch()

        response = client.get(f"/api/preview?path={test_file}")
        assert response.status_code == 415


class TestFileEndpoint:
    """Tests for file serving endpoint."""

    def test_file_nonexistent_returns_404(self, client):
        response = client.get("/api/file?path=/nonexistent/file.jpg")
        assert response.status_code == 404

    def test_file_unsupported_format_returns_415(self, client, tmp_path):
        test_file = tmp_path / "document.pdf"
        test_file.touch()

        response = client.get(f"/api/file?path={test_file}")
        assert response.status_code == 415

    def test_file_serves_jpeg(self, client, tmp_path):
        test_file = tmp_path / "image.jpg"
        test_file.write_bytes(b"\xff\xd8\xff\xe0")  # JPEG magic bytes

        response = client.get(f"/api/file?path={test_file}")
        assert response.status_code == 200
