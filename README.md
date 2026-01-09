# 🖼️ Spectrum (v2.0)

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

---

## ⚡ Client Installation Guide

This guide is designed for setting up the application on a new machine (e.g., the client's Mac).

### Phase 1: System Preparation

#### 1. Install Docker Desktop
The application runs in a container to ensure it works exactly the same on every machine.
1.  Download **Docker Desktop for Mac (Apple Silicon)** from [docker.com](https://www.docker.com/products/docker-desktop/).
2.  Install and launch it.
3.  **Important**: Wait until you see the green "Engine Running" status in the Docker dashboard.

#### 2. Prepare the Project
1.  Copy the project folder `michi-img-convert` to the Desktop (or anywhere in `/Users/username`).
2.  Open the **Terminal** app.

### Phase 2: Launch

#### 1. Navigate to the Folder
Type `cd` followed by a space, then drag the `michi-img-convert` folder from Finder into the Terminal window. It will look like this:
```bash
cd /Users/username/Desktop/michi-img-convert
```
Press **Enter**.

#### 2. Start the Application
We have automated the setup process. Simply run:
```bash
make start
```
**What to expect:**
- You will see "Building..." and "Starting Spectrum...".
- The first run may take 1-2 minutes to download dependencies.
- Once finished, it will say: `✅ Services started in background.`

#### 3. Open the Interface
Run:
```bash
make open
```
This will launch Chrome/Safari to `http://localhost:3000`.

---

## 🪟 Windows Client Setup

This section is for Windows machines using Docker Desktop.

### 1. Install Docker Desktop
Download **Docker Desktop for Windows** from docker.com and make sure the engine is running.

### 2. Start the App
Open **Command Prompt** and run:
```bat
start.bat
```

### 3. Ensure Drive Sharing
The app needs access to your photos directory via Docker mounts.
- Default mounts: `C:\Users` (as `/Users`) and `C:\` (as `/Volumes`).
- If your photos are on another drive, edit `start.bat`:
  - `set SPECTRUM_USERS_MOUNT=C:\Users`
  - `set SPECTRUM_VOLUMES_MOUNT=D:\`
- Make sure the drive is shared in Docker Desktop settings.

### Phase 3: Usage Workflow

Now you are ready to convert files.

#### 1. Select Source Folder
1.  Click the **📁 Browse** button.
2.  **Home Folder**: Navigate to `Users (Home)` -> `[Username]` -> `Desktop` -> `Photos`.
3.  **External Drive**: Navigate to `Volumes (Drives)` -> `[Drive Name]` -> `Photos`.
4.  Click **Select This Folder**.

#### 2. Scan & Convert
1.  Click **Scan Directory**. The system will find all `.ARW` files.
2.  (Optional) Click individual files to preview metadata.
3.  Select the files you want (or "Select All").
4.  Click **Convert Selected**.

#### 3. Verify Results
The converted JPEGs will appear in a `converted` subfolder inside your source folder.
*Example:* `.../Photos/converted/DSC0123.jpg`

---

## 🛠️ Advanced Commands

The project includes a `Makefile` to make common tasks frictionless.

- `make logs`: View real-time logs from the backend and frontend.
- `make restart`: Restart the environment.
- `make clean`: Clean up all containers and artifacts.
- `make stop`: Shut down the containers cleanly.

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
**Author:** Samuel for Spectrum
**License:** MIT
