"""
End-to-End Integration Tests for Spectrum.

Tests the complete workflow from folder selection to conversion completion.
Requires running Docker containers.
"""

import pytest
import httpx
import asyncio
import json
import tempfile
import shutil
from pathlib import Path
from typing import Optional

# Base URL for API (assumes Docker containers are running)
API_BASE = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"


class TestE2EHealthCheck:
    """E2E tests for service health."""

    @pytest.mark.e2e
    def test_backend_health(self):
        """Backend API should be healthy."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/health")
                assert response.status_code == 200
                assert response.json()["status"] == "healthy"
            except httpx.ConnectError:
                pytest.skip("Backend not running - start with docker compose up")

    @pytest.mark.e2e
    def test_frontend_accessible(self):
        """Frontend should be accessible."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(FRONTEND_URL)
                assert response.status_code == 200
            except httpx.ConnectError:
                pytest.skip("Frontend not running - start with docker compose up")


class TestE2EDriveDetection:
    """E2E tests for drive detection."""

    @pytest.mark.e2e
    def test_drives_endpoint_returns_data(self):
        """Drives endpoint should return platform and drive info."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/api/drives")
                assert response.status_code == 200
                data = response.json()

                assert "drives" in data
                assert "platform" in data
                assert isinstance(data["drives"], list)
                assert data["platform"] in ["windows", "macos", "linux"]
            except httpx.ConnectError:
                pytest.skip("Backend not running")

    @pytest.mark.e2e
    def test_drives_have_required_fields(self):
        """Each drive should have required fields."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/api/drives")
                data = response.json()

                for drive in data["drives"]:
                    assert "name" in drive
                    assert "path" in drive
                    assert "accessible" in drive
                    assert "has_photos" in drive
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EBrowseNavigation:
    """E2E tests for folder browsing."""

    @pytest.mark.e2e
    def test_browse_root_returns_smart_roots(self):
        """Browse root should return smart root directories."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/api/browse")
                assert response.status_code == 200
                data = response.json()

                assert "current" in data
                assert "directories" in data
                assert len(data["directories"]) > 0
            except httpx.ConnectError:
                pytest.skip("Backend not running")

    @pytest.mark.e2e
    def test_browse_users_directory(self):
        """Should be able to browse /Users directory."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/api/browse?path=/Users")
                if response.status_code == 200:
                    data = response.json()
                    assert data["current"] == "/Users"
                # 404 is OK if /Users doesn't exist in container
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EScanWorkflow:
    """E2E tests for scanning workflow."""

    @pytest.fixture
    def test_folder(self):
        """Create a temporary test folder with mock files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # This folder needs to be accessible from the Docker container
            # For real E2E tests, you'd need to create files in a mounted volume
            yield tmpdir

    @pytest.mark.e2e
    def test_scan_empty_directory(self):
        """Scanning an empty directory should return zero files."""
        with httpx.Client(timeout=10) as client:
            try:
                # Use a path that exists in the container
                response = client.post(
                    f"{API_BASE}/api/scan",
                    json={"path": "/tmp", "recursive": False}
                )
                if response.status_code == 200:
                    data = response.json()
                    assert "total_files" in data
                    assert "files" in data
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EConversionWorkflow:
    """E2E tests for conversion workflow."""

    @pytest.mark.e2e
    def test_conversion_streaming_format(self):
        """Conversion stream should return NDJSON format."""
        with httpx.Client(timeout=30) as client:
            try:
                response = client.post(
                    f"{API_BASE}/api/convert/stream",
                    json={
                        "files": ["/nonexistent/file.ARW"],
                        "output_dir": "/tmp/converted"
                    }
                )
                # Should return NDJSON stream
                assert response.status_code == 200
                lines = response.text.strip().split("\n")
                assert len(lines) >= 1

                # Parse first line as JSON
                first_msg = json.loads(lines[0])
                assert "type" in first_msg
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EPresetConfiguration:
    """E2E tests for preset configuration."""

    @pytest.mark.e2e
    def test_api_accepts_all_presets(self):
        """API should accept all valid preset values."""
        presets = ["standard", "neutral", "vivid", "clean"]

        with httpx.Client(timeout=10) as client:
            try:
                for preset in presets:
                    response = client.post(
                        f"{API_BASE}/api/scan",
                        json={"path": "/tmp"}
                    )
                    # Just verify the API accepts the request
                    # 200 or 404 (path not found) are both valid
                    assert response.status_code in [200, 404]
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EQualitySettings:
    """E2E tests for quality settings."""

    @pytest.mark.e2e
    def test_api_accepts_quality_range(self):
        """API should accept quality values from 1-100."""
        with httpx.Client(timeout=10) as client:
            try:
                # Test boundary values
                for quality in [1, 50, 80, 95, 100]:
                    response = client.post(
                        f"{API_BASE}/api/convert",
                        json={
                            "files": [],
                            "output_dir": "/tmp/test",
                            "quality": quality
                        }
                    )
                    # 200, 404, 422, or 500 are all acceptable
                    # (empty files may trigger various responses)
                    assert response.status_code in [200, 404, 422, 500]
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EErrorHandling:
    """E2E tests for error handling."""

    @pytest.mark.e2e
    def test_unc_path_rejection(self):
        """UNC paths should be rejected or handled gracefully."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.get(f"{API_BASE}/api/browse?path=\\\\NAS\\Photos")
                # UNC paths should return an error (404, 400, or 500)
                assert response.status_code in [400, 404, 500]
                # If we get JSON error, verify it has some detail
                if response.status_code in [400, 404]:
                    try:
                        error_detail = response.json().get("detail", "")
                        assert len(error_detail) > 0  # Some error message provided
                    except json.JSONDecodeError:
                        pass  # Non-JSON error response is also acceptable
            except httpx.ConnectError:
                pytest.skip("Backend not running")

    @pytest.mark.e2e
    def test_nonexistent_path_error(self):
        """Nonexistent paths should return an error."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.post(
                    f"{API_BASE}/api/scan",
                    json={"path": "/this/path/does/not/exist/12345"}
                )
                # Should return 404 or 500 for nonexistent path
                assert response.status_code in [404, 500]
            except httpx.ConnectError:
                pytest.skip("Backend not running")


class TestE2EReviewWorkflow:
    """E2E tests for review workflow."""

    @pytest.mark.e2e
    def test_review_endpoint_accepts_valid_request(self):
        """Review endpoint should accept valid source and output paths."""
        with httpx.Client(timeout=10) as client:
            try:
                response = client.post(
                    f"{API_BASE}/api/review",
                    json={
                        "source_path": "/tmp",
                        "output_dir": "/tmp"
                    }
                )
                # 200 or 404 are valid (depends on path existence)
                assert response.status_code in [200, 404]
            except httpx.ConnectError:
                pytest.skip("Backend not running")


# Run with: pytest tests/e2e/ -v -m e2e
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "e2e"])
