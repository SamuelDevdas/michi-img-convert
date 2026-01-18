# Spectrum - ARW to JPEG Converter

Dockerized web app for batch converting Sony ARW RAW files to high-quality JPEGs with EXIF preservation. Backend: FastAPI + rawpy. Frontend: Next.js + Tailwind.

## Tech Stack

- **Backend**: Python 3.12, FastAPI, rawpy, Pillow, exiftool
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Infrastructure**: Docker Compose (michi-backend, michi-frontend)

## Key Directories

```text
backend/
├── app/main.py          # FastAPI routes
├── app/services/        # converter.py, scanner.py
└── tests/               # unit/, integration/

frontend/
├── src/app/page.tsx     # Main page with state management
├── src/components/      # UI components
└── src/hooks/           # useConverter.ts API client
```

## Commands

```bash
# Development
docker compose up -d --build        # Start all containers
docker compose up -d --build frontend  # Rebuild frontend only

# Testing
./run_tests.sh unit    # Backend unit tests (63 tests)
./run_tests.sh api     # API integration tests (25 tests)
./run_tests.sh all     # All tests

# Logs
docker compose logs -f backend
```

## Code Conventions

### Backend (Python)

- Skip macOS resource fork files (`._*`) in all file scanning
- Wrap `stat()` calls in `try/except (PermissionError, OSError)`
- Return 404 for missing paths, let exceptions bubble as 500

### Frontend (React/TypeScript)

- CSS variables: `var(--accent)`, `var(--card-bg)`, `var(--secondary-text)`
- Accent color: cyan `rgba(6,182,212,x)`
- Use AbortController with 10s timeout for fetch requests
- Modals: constrain content height (e.g., `h-[45vh]`), avoid scrolling
- Show "Not available" for missing data instead of hiding fields
- Position badges with `absolute -top-2 right-3`

### Progress Tracking

- Stats must add up: `processed = successful + failed + skipped`
- When restoring saved reviews: `skipped = 0` (not doing new conversion)

## Gotchas

- **UNC paths don't work in Docker** - Must map to drive letters (Windows) or mount volumes (macOS)
- **macOS `._` files cause permission errors** - Always filter them out
- **Error codes vary** - Test for `in (404, 500)` not exact codes
- **Fetch can hang on NAS** - Always use timeouts
