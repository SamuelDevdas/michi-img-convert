"""
Path utilities for handling Windows-style paths inside Linux containers.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict

WINDOWS_PATH_RE = re.compile(r"^[a-zA-Z]:([/\\\\]|$)")


@dataclass(frozen=True)
class ResolvedPath:
    original: str
    path: Path
    was_windows: bool
    candidates: List[Path]


def is_windows_path(path: str) -> bool:
    if not path:
        return False
    return bool(WINDOWS_PATH_RE.match(path))


def split_windows_path(path: str) -> tuple[str, str]:
    drive = path[0].lower()
    rest = path[2:] if len(path) > 2 else ""
    rest = rest.lstrip("\\/").replace("\\", "/")
    return drive, rest


def windows_candidate_paths(path: str) -> List[Path]:
    if not is_windows_path(path):
        return []

    drive, rest = split_windows_path(path)
    candidates: List[Path] = []

    for base in (Path("/host_mnt"), Path("/mnt")):
        base_path = base / drive
        candidates.append(base_path / rest if rest else base_path)

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
    if is_windows_path(path):
        candidates = windows_candidate_paths(path)
        for candidate in candidates:
            if candidate.exists():
                return ResolvedPath(original=path, path=candidate, was_windows=True, candidates=candidates)
        if candidates:
            return ResolvedPath(original=path, path=candidates[0], was_windows=True, candidates=candidates)
        return ResolvedPath(original=path, path=Path(path), was_windows=True, candidates=[])

    return ResolvedPath(original=path, path=Path(path), was_windows=False, candidates=[])


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
