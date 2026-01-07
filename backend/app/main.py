"""
Spectrum API - Professional RAW Converter by TrueVine Insights.

FastAPI backend providing ARW to JPEG conversion services.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path

from app.services.scanner import ScannerService, FileInfo
from app.services.converter import ConverterService
from app.services.exif import ExifService

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
                "directories": [
                    {"name": "Users (Home)", "path": "/Users"},
                    {"name": "Volumes (Drives)", "path": "/Volumes"},
                ],
            }

        target = Path(path)

        if not target.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {path}")

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
        if parent == str(target):  # We are at root of a mount
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
        files = await scanner_service.scan_directory(
            path=request.path,
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

        output_dir = Path(request.output_dir)

        for file_path in request.files:
            src = Path(file_path)

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
