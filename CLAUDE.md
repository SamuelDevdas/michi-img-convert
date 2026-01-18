# Project Rules

## File System Operations
- **Always skip macOS resource fork files** - Files starting with `._` cause permission errors on NAS/network drives. Filter them out in any file scanning/listing code.
- **Wrap file stat() calls in try/except** - Network drives can have intermittent permission issues. Catch `PermissionError` and `OSError`.

## Docker & NAS
- Network paths (UNC like `\\NAS\Photos`) don't work in Docker - must be mapped to drive letters on Windows or mounted volumes on macOS.
- Test file operations with both local and network-mounted drives.

## Frontend UI/UX
- **Modals must fit on screen** - Don't use scrolling modals; users miss content below the fold. Constrain image areas instead (e.g., `h-[45vh]`).
- **Add timeouts to fetch requests** - Use AbortController with 10s timeout to prevent infinite spinners.
- **Show all fields with placeholders** - Display "Not available" or "Not recorded" for missing data rather than hiding fields.
- **Absolute position badges** - Use `absolute -top-2 right-3` for badges to prevent overlap issues.

## Styling
- Use CSS variables: `var(--accent)`, `var(--card-bg)`, `var(--secondary-text)`
- Accent color is cyan: `rgba(6,182,212,x)` for glows/shadows

## Testing
- Backend unit tests: `./run_tests.sh unit`
- API integration tests: `./run_tests.sh api`
- Error status codes (404 vs 500) vary by exception handling - test for `in (404, 500)` when checking error responses.

## Commands
- Rebuild containers: `docker compose up -d --build frontend` or `backend`
- Run all tests: `./run_tests.sh all`
