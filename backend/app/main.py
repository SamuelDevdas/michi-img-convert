"""
Spectrum API - Professional RAW Converter by TrueVine Insights.

FastAPI backend providing ARW to JPEG conversion services.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path

from app.services.scanner import ScannerService, FileInfo
from app.services.converter import ConverterService
from app.services.exif import ExifService
from app.utils.paths import (
    resolve_path,
    get_smart_roots,
    is_drive_mount_root,
    normalize_input_path,
)

app = FastAPI(
    title="Spectrum API",
    description="Professional RAW image converter by TrueVine Insights",
    version="2.0.0",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
scanner_service = ScannerService()
converter_service = ConverterService()
exif_service = ExifService()


# Request/Response Models
class ScanRequest(BaseModel):
    path: str
    recursive: bool = True
    output_subdir: str = "converted"


class ScanResponse(BaseModel):
    total_files: int
    already_converted: int
    pending_conversion: int
    total_size_mb: float
    files: List[dict]


class ConvertRequest(BaseModel):
    files: List[str]
    output_dir: str
    quality: int = 90
    preserve_exif: bool = True


class ConvertResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[dict]


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Spectrum API",
        "version": "2.0.0",
        "status": "Ready",
        "message": "Professional RAW image converter by TrueVine Insights",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/browse")
async def browse_directory(path: str = ""):
    """
    Browse filesystem directories.

    Returns list of subdirectories for folder picker navigation.
    Handles "Smart Roots" to show relevant starting points.
    """
    try:
        # Smart Root: If path is empty, show top-level folders we care about
        if not path or path == "/":
            return {
                "current": "/",
                "parent": None,
                "directories": get_smart_roots(),
            }

        resolved = resolve_path(path)
        target = resolved.path

        if not target.exists():
            if resolved.is_unc:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"UNC paths are not accessible: {resolved.original}. "
                        "Please map the network share to a drive letter (e.g., Z:) and try again."
                    ),
                )
            if resolved.was_windows:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Path not found: {resolved.original}. "
                        "Windows paths must be shared with Docker. "
                        "Try using the Browse button or share the drive in Docker Desktop."
                    ),
                )
            raise HTTPException(status_code=404, detail=f"Path not found: {resolved.original}")

        if not target.is_dir():
            raise HTTPException(status_code=400, detail=f"Not a directory: {path}")

        # Get subdirectories only (not files)
        directories = []

        # safely iterate
        try:
            for item in target.iterdir():
                try:
                    # Filter out hidden folders and focus on directories
                    if not item.name.startswith(".") and item.is_dir():
                        directories.append(
                            {
                                "name": item.name,
                                "path": str(item),
                            }
                        )
                except (PermissionError, OSError):
                    continue
        except (PermissionError, OSError):
            pass  # Entire directory is unreadable

        directories.sort(key=lambda x: x["name"])

        # Determine parent
        parent = str(target.parent)
        if parent == str(target) or is_drive_mount_root(target):
            parent = "/"

        return {
            "current": str(target),
            "parent": parent,
            "directories": directories,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Browse error: {str(e)}")


@app.post("/api/scan", response_model=ScanResponse)
async def scan_directory(request: ScanRequest):
    """
    Scan directory for ARW files.

    Returns summary of discovered files and their conversion status.
    """
    try:
        # Scan directory
        resolved = resolve_path(request.path)
        if not resolved.path.exists():
            if resolved.is_unc:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"UNC paths are not accessible: {resolved.original}. "
                        "Please map the network share to a drive letter (e.g., Z:) and try again."
                    ),
                )
            if resolved.was_windows:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Directory not found: {resolved.original}. "
                        "Windows paths must be shared with Docker (e.g., C:\\Users)."
                    ),
                )
            raise HTTPException(status_code=404, detail=f"Directory not found: {resolved.original}")

        files = await scanner_service.scan_directory(
            path=str(resolved.path),
            recursive=request.recursive,
            output_subdir=request.output_subdir,
        )

        # Generate summary
        summary = scanner_service.get_summary(files)

        # Convert FileInfo objects to dicts
        file_dicts = [
            {"path": f.path, "size": f.size, "already_converted": f.already_converted}
            for f in files
        ]

        return ScanResponse(
            total_files=summary["total_files"],
            already_converted=summary["already_converted"],
            pending_conversion=summary["pending_conversion"],
            total_size_mb=summary["total_size_mb"],
            files=file_dicts,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except NotADirectoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")


@app.post("/api/convert", response_model=ConvertResponse)
async def convert_files(request: ConvertRequest):
    """
    Convert ARW files to JPEG.

    Processes files sequentially with optional EXIF preservation.
    """
    try:
        results = []
        successful = 0
        failed = 0

        # Resolve input files first to support fallback output dir selection
        resolved_files = [resolve_path(p) for p in request.files]
        existing_files = [rf.path for rf in resolved_files if rf.path.exists()]
        missing_files = [rf.original for rf in resolved_files if not rf.path.exists()]

        if not existing_files:
            raise HTTPException(
                status_code=404,
                detail="No input files are accessible. Share the drive in Docker Desktop or choose a folder under a shared path.",
            )

        resolved_output = resolve_path(request.output_dir)
        output_dir = resolved_output.path

        # Allow creating the output directory if its parent exists. If not, try a safe fallback.
        if not output_dir.exists() and not output_dir.parent.exists():
            try:
                common_root = Path(os.path.commonpath([str(p) for p in existing_files]))
            except ValueError:
                common_root = None

            if common_root:
                if common_root.exists() and common_root.is_file():
                    common_root = common_root.parent
                # Avoid falling back to filesystem root or drive roots
                if (
                    str(common_root) not in {"/", "."}
                    and not is_drive_mount_root(common_root)
                    and common_root.exists()
                    and common_root.is_dir()
                ):
                    output_dir = common_root / "converted"
                else:
                    common_root = None

            if not output_dir.exists() and not output_dir.parent.exists():
                detail_path = resolved_output.original or normalize_input_path(request.output_dir)
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Output path not accessible: {detail_path}. "
                        "Share the drive in Docker Desktop or choose a folder under a shared path."
                    ),
                )

        for missing in missing_files:
            results.append(
                {
                    "src": missing,
                    "dst": str(output_dir),
                    "success": False,
                    "error": "File not accessible: ensure the drive is shared with Docker.",
                    "size_bytes": None,
                }
            )
            failed += 1

        for file_path in existing_files:
            src = file_path

            # Determine output path (maintain directory structure)
            dst = output_dir / src.with_suffix(".jpg").name

            # Convert file
            result = await converter_service.convert_file(
                src=src, dst=dst, quality=request.quality
            )

            # Preserve EXIF if requested and conversion succeeded
            if result.success and request.preserve_exif:
                await exif_service.copy_exif(src, dst)

            # Track results
            if result.success:
                successful += 1
            else:
                failed += 1

            results.append(
                {
                    "src": result.src_path,
                    "dst": result.dst_path,
                    "success": result.success,
                    "error": result.error,
                    "size_bytes": result.size_bytes,
                }
            )

        return ConvertResponse(
            total=len(request.files),
            successful=successful,
            failed=failed,
            results=results,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")
