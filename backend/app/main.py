"""
Spectrum API - Professional RAW Converter by TrueVine Insights.

FastAPI backend providing ARW to JPEG conversion services.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Callable, Awaitable
import os
import json
import inspect
import asyncio
from io import BytesIO
import mimetypes
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

ALLOWED_PREVIEW_EXTS = {".arw", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}
ALLOWED_FILE_EXTS = {".arw", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}

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
    quality: int = 100
    preserve_exif: bool = True
    preset: str = "standard"


class ConvertResponse(BaseModel):
    total: int
    successful: int
    failed: int
    skipped: int
    results: List[dict]


class ReviewRequest(BaseModel):
    source_path: str
    output_dir: str
    limit: Optional[int] = None


class ReviewResponse(BaseModel):
    total_original: int
    total_converted: int
    pairs: List[dict]


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


@app.get("/api/preview")
async def preview_file(path: str):
    """
    Return a lightweight JPEG preview for RAW/JPEG files.
    """
    resolved = resolve_path(path)
    target = resolved.path
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {resolved.original}")
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory.")

    ext = target.suffix.lower()
    if ext not in ALLOWED_PREVIEW_EXTS:
        raise HTTPException(status_code=415, detail="Preview not supported for this file.")

    max_dim = int(os.getenv("SPECTRUM_PREVIEW_MAX", "1600"))
    quality = int(os.getenv("SPECTRUM_PREVIEW_QUALITY", "85"))

    try:
        from PIL import Image
        import rawpy

        if ext == ".arw":
            with rawpy.imread(str(target)) as raw:
                rgb = raw.postprocess(
                    use_camera_wb=True,
                    no_auto_bright=True,
                    output_bps=8,
                    half_size=True,
                    output_color=rawpy.ColorSpace.sRGB,
                )
            image = Image.fromarray(rgb)
        else:
            image = Image.open(target).convert("RGB")

        image.thumbnail((max_dim, max_dim), Image.LANCZOS)

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview error: {str(e)}")


@app.get("/api/file")
async def serve_file(path: str):
    """
    Serve original or converted files for download or inspection.
    """
    resolved = resolve_path(path)
    target = resolved.path
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {resolved.original}")
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory.")

    ext = target.suffix.lower()
    if ext not in ALLOWED_FILE_EXTS:
        raise HTTPException(status_code=415, detail="File type not supported.")

    media_type, _ = mimetypes.guess_type(str(target))
    return FileResponse(target, media_type=media_type or "application/octet-stream")


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


async def _run_conversion(
    request: ConvertRequest,
    progress_cb: Optional[Callable[[dict], Awaitable[None] | None]] = None,
) -> ConvertResponse:
    results = []
    successful = 0
    failed = 0
    skipped = 0

    skip_existing = os.getenv("SPECTRUM_SKIP_EXISTING", "1") != "0"

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

    async def emit(result_payload: dict):
        if not progress_cb:
            return
        if inspect.iscoroutinefunction(progress_cb):
            await progress_cb(result_payload)
        else:
            progress_cb(result_payload)

    for missing in missing_files:
        payload = {
            "src": missing,
            "dst": str(output_dir),
            "success": False,
            "skipped": False,
            "error": "File not accessible: ensure the drive is shared with Docker.",
            "size_bytes": None,
            "metadata_copied": False,
            "metadata_error": "source file not accessible",
        }
        results.append(payload)
        failed += 1
        await emit(payload)

    for file_path in existing_files:
        src = file_path

        # Determine output path (maintain directory structure)
        source_root = output_dir.parent
        try:
            relative_path = src.relative_to(source_root)
        except ValueError:
            relative_path = Path(src.name)
        dst = output_dir / relative_path.with_suffix(".jpg")

        if skip_existing and dst.exists():
            metadata_copied = False
            metadata_error = None
            if request.preserve_exif:
                metadata_copied, metadata_error = await exif_service.copy_exif(
                    src, dst
                )
            payload = {
                "src": str(src),
                "dst": str(dst),
                "success": True,
                "skipped": True,
                "error": None,
                "size_bytes": dst.stat().st_size if dst.exists() else None,
                "metadata_copied": metadata_copied,
                "metadata_error": metadata_error,
            }
            results.append(payload)
            skipped += 1
            await emit(payload)
            continue

        # Convert file
        result = await converter_service.convert_file(
            src=src,
            dst=dst,
            quality=request.quality,
            preset=request.preset,
        )

        metadata_copied = False
        metadata_error = None

        # Preserve EXIF if requested and conversion succeeded
        if result.success and request.preserve_exif:
            metadata_copied, metadata_error = await exif_service.copy_exif(src, dst)

        # Track results
        if result.success:
            successful += 1
        else:
            failed += 1

        payload = {
            "src": result.src_path,
            "dst": result.dst_path,
            "success": result.success,
            "skipped": False,
            "error": result.error,
            "size_bytes": result.size_bytes,
            "metadata_copied": metadata_copied,
            "metadata_error": metadata_error,
        }
        results.append(payload)
        await emit(payload)

    return ConvertResponse(
        total=len(request.files),
        successful=successful,
        failed=failed,
        skipped=skipped,
        results=results,
    )


@app.post("/api/convert", response_model=ConvertResponse)
async def convert_files(request: ConvertRequest):
    """
    Convert ARW files to JPEG.

    Processes files sequentially with optional EXIF preservation.
    """
    try:
        return await _run_conversion(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


@app.post("/api/convert/stream")
async def convert_files_stream(request: ConvertRequest, fastapi_request: Request):
    """
    Stream conversion progress as NDJSON.
    """

    async def event_stream():
        progress = {"processed": 0, "successful": 0, "failed": 0, "skipped": 0}

        def update_counts(payload: dict):
            progress["processed"] += 1
            if payload.get("skipped"):
                progress["skipped"] += 1
            elif payload.get("success"):
                progress["successful"] += 1
            else:
                progress["failed"] += 1

        async def on_progress(payload: dict):
            update_counts(payload)
            if await fastapi_request.is_disconnected():
                return
            message = {
                "type": "progress",
                "processed": progress["processed"],
                "successful": progress["successful"],
                "failed": progress["failed"],
                "skipped": progress["skipped"],
                "result": payload,
            }
            yield_line = json.dumps(message) + "\n"
            await stream_queue.put(yield_line)

        stream_queue: asyncio.Queue[str] = asyncio.Queue()

        await stream_queue.put(json.dumps({"type": "start", "total": len(request.files)}) + "\n")

        async def producer():
            try:
                await _run_conversion(request, on_progress)
                await stream_queue.put(
                    json.dumps(
                        {
                            "type": "complete",
                            "processed": progress["processed"],
                            "successful": progress["successful"],
                            "failed": progress["failed"],
                            "skipped": progress["skipped"],
                            "total": len(request.files),
                        }
                    )
                    + "\n"
                )
            except Exception as e:
                await stream_queue.put(
                    json.dumps({"type": "error", "message": str(e)}) + "\n"
                )

        producer_task = asyncio.create_task(producer())

        try:
            while True:
                line = await stream_queue.get()
                yield line
                if line.startswith("{\"type\": \"complete\"") or line.startswith(
                    "{\"type\": \"error\""
                ):
                    break
        finally:
            producer_task.cancel()

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


@app.post("/api/review", response_model=ReviewResponse)
async def build_review_pairs(request: ReviewRequest):
    """
    Rebuild comparison pairs from an existing source folder and output folder.
    """
    resolved_source = resolve_path(request.source_path)
    source_dir = resolved_source.path
    if not source_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Source path not found: {resolved_source.original}",
        )
    if not source_dir.is_dir():
        raise HTTPException(
            status_code=400,
            detail=f"Source path is not a directory: {resolved_source.original}",
        )

    resolved_output = resolve_path(request.output_dir)
    output_dir = resolved_output.path
    if not output_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Output path not found: {resolved_output.original}",
        )

    total_original = 0
    total_converted = 0
    pairs: List[dict] = []

    for pattern in ("*.arw", "*.ARW"):
        for arw_file in source_dir.rglob(pattern):
            total_original += 1
            try:
                relative_path = arw_file.relative_to(source_dir)
            except ValueError:
                relative_path = Path(arw_file.name)
            converted_path = output_dir / relative_path.with_suffix(".jpg")
            if converted_path.exists():
                total_converted += 1
                pairs.append(
                    {
                        "src": str(arw_file),
                        "dst": str(converted_path),
                        "success": True,
                        "skipped": True,
                        "error": None,
                    }
                )

                if request.limit and len(pairs) >= request.limit:
                    break
        if request.limit and len(pairs) >= request.limit:
            break

    return ReviewResponse(
        total_original=total_original,
        total_converted=total_converted,
        pairs=pairs,
    )
