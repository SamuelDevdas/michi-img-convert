# 🖼️ Michi Image Converter (v2.0)

> **A professional-grade ARW to JPEG converter for high-volume photography workflows.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](docker-compose.yml)

---

## 🚀 Overview

This tool is designed to solve the specific pain points of processing thousands of Sony RAW files stored on a NAS. It provides a **frictionless, local-first web interface** to manage conversions with:
- **Zero Data Loss:** Atomic writes and robust error handling.
- **Full Metadata Preservation:** Keeps your EXIF, GPS, and Camera settings intact.
- **Real-time Feedback:** Live progress dashboard so you never wonder "is it frozen?".

## 📚 Documentation

The complete project blueprint is available in the `docs/` directory:

- [**📘 Project Blueprint**](docs/PROJECT_BLUEPRINT.md) - Single source of truth for Requirements, UX, Architecture, and Plan.

## 🛠️ Quick Start (Coming Soon)

_The v2.0 Web Application is currently under active development. See [Project Blueprint](docs/PROJECT_BLUEPRINT.md) for roadmap._

### Legacy CLI
If you are looking for the simple command-line script, it is currently in maintenance mode.
```bash
python convert_arw_cli.py --help
```

## 🏗️ Project Structure
```
.
├── backend/            # FastAPI Server (Python)
├── frontend/           # Next.js Client (React)
├── docs/               # Architecture & Specifications
├── docker-compose.yml  # Orchestration
└── README.md           # You are here
```

---
**Author:** Samuel for Michi  
**License:** MIT
