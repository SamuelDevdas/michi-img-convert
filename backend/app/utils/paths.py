"""
Path utilities for handling Windows-style paths inside Linux containers.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict

WINDOWS_PATH_RE = re.compile(r"^[a-zA-Z]:([/\\\\]|$)")
UNC_PATH_RE = re.compile(r"^\\\\[^\\\\]+\\\\[^\\\\]+")


@dataclass(frozen=True)
class ResolvedPath:
    original: str
    path: Path
    was_windows: bool
    is_unc: bool
    candidates: List[Path]


def normalize_input_path(path: str | None) -> str:
    if not path:
        return ""
    cleaned = path.strip()
    if len(cleaned) >= 2:
        if (cleaned.startswith('"') and cleaned.endswith('"')) or (
            cleaned.startswith("'") and cleaned.endswith("'")
        ):
            cleaned = cleaned[1:-1].strip()
    return cleaned


def is_windows_path(path: str) -> bool:
    if not path:
        return False
    normalized = normalize_input_path(path)
    return bool(WINDOWS_PATH_RE.match(normalized) or UNC_PATH_RE.match(normalized))


def split_windows_path(path: str) -> tuple[str, str]:
    normalized = normalize_input_path(path)
    drive = normalized[0].lower()
    rest = normalized[2:] if len(normalized) > 2 else ""
    rest = rest.lstrip("\\/").replace("\\", "/")
    return drive, rest


def windows_candidate_paths(path: str) -> List[Path]:
    if not is_windows_path(path):
        return []
    normalized = normalize_input_path(path)

    if UNC_PATH_RE.match(normalized):
        return []

    drive, rest = split_windows_path(normalized)
    candidates: List[Path] = []

    volumes_drive = get_volumes_drive_letter()

    for base in (Path("/host_mnt"), Path("/mnt")):
        base_path = base / drive
        candidates.append(base_path / rest if rest else base_path)

    if volumes_drive and volumes_drive == drive:
        volume_root = Path("/Volumes")
        candidates.append(volume_root / rest if rest else volume_root)

    drive_root = Path(f"/{drive}")
    candidates.append(drive_root / rest if rest else drive_root)

    if drive == "c" and rest.lower().startswith("users/"):
        tail = rest.split("/", 1)[1] if "/" in rest else ""
        candidate = Path("/Users") / tail if tail else Path("/Users")
        candidates.append(candidate)

    unique: List[Path] = []
    seen = set()
    for candidate in candidates:
        key = str(candidate)
        if key not in seen:
            seen.add(key)
            unique.append(candidate)

    return unique


def resolve_path(path: str) -> ResolvedPath:
    normalized = normalize_input_path(path)

    if not normalized:
        return ResolvedPath(
            original="", path=Path("."), was_windows=False, is_unc=False, candidates=[]
        )

    if UNC_PATH_RE.match(normalized):
        return ResolvedPath(
            original=normalized,
            path=Path(normalized),
            was_windows=True,
            is_unc=True,
            candidates=[],
        )

    if is_windows_path(normalized):
        candidates = windows_candidate_paths(normalized)
        for candidate in candidates:
            if candidate.exists():
                return ResolvedPath(
                    original=normalized,
                    path=candidate,
                    was_windows=True,
                    is_unc=False,
                    candidates=candidates,
                )
        if candidates:
            return ResolvedPath(
                original=normalized,
                path=candidates[0],
                was_windows=True,
                is_unc=False,
                candidates=candidates,
            )
        return ResolvedPath(
            original=normalized,
            path=Path(normalized),
            was_windows=True,
            is_unc=False,
            candidates=[],
        )

    return ResolvedPath(
        original=normalized,
        path=Path(normalized),
        was_windows=False,
        is_unc=False,
        candidates=[],
    )


def get_volumes_drive_letter() -> str | None:
    value = os.getenv("SPECTRUM_VOLUMES_DRIVE", "").strip()
    if not value:
        return None
    letter = value[0].lower()
    if not letter.isalpha():
        return None
    return letter


def detect_windows_drive_mounts() -> Dict[str, Path]:
    drives: Dict[str, Path] = {}

    for base in (Path("/host_mnt"), Path("/mnt")):
        try:
            if base.exists() and base.is_dir():
                for entry in base.iterdir():
                    name = entry.name.lower()
                    if entry.is_dir() and len(name) == 1 and name.isalpha():
                        if name not in drives:
                            drives[name] = entry
        except (PermissionError, OSError):
            continue

    for letter in "abcdefghijklmnopqrstuvwxyz":
        if letter in drives:
            continue
        candidate = Path(f"/{letter}")
        try:
            if candidate.exists() and candidate.is_dir():
                drives[letter] = candidate
        except (PermissionError, OSError):
            continue

    return drives


def get_smart_roots() -> List[dict]:
    roots: List[dict] = []

    drives = detect_windows_drive_mounts()
    for letter in sorted(drives.keys()):
        roots.append({"name": f"{letter.upper()}: (Drive)", "path": str(drives[letter])})

    if Path("/Users").exists():
        roots.append({"name": "Users (Home)", "path": "/Users"})

    if Path("/Volumes").exists():
        roots.append({"name": "Volumes (Drives)", "path": "/Volumes"})

    if not roots:
        roots.append({"name": "Root", "path": "/"})

    return roots


def is_drive_mount_root(path: Path) -> bool:
    parts = path.parts

    if len(parts) == 3 and parts[0] == "/" and parts[1] in {"host_mnt", "mnt"}:
        return len(parts[2]) == 1 and parts[2].isalpha()

    if len(parts) == 2 and parts[0] == "/":
        return len(parts[1]) == 1 and parts[1].isalpha()

    return False
