# Legacy Scripts Archive

This folder contains the original CLI implementation of the Michi Image Converter.

## Files

- `convert_arw_cli.py` - Original command-line ARW to JPEG converter
- `USER_INSTRUCTIONS.md` - User guide for the CLI version

## Why Archived?

These files contain valuable reference implementations and library usage patterns that informed the v2.0 web application design. They are preserved here for:

1. **Reference:** Understanding the core conversion logic (rawpy + imageio)
2. **Lessons Learned:** Error handling patterns and edge cases discovered
3. **Legacy Support:** Users who prefer the simple CLI can still use these scripts

## Using the Legacy CLI

If you want to use the old CLI version:

```bash
cd archive/
python convert_arw_cli.py --help
```

**Note:** The legacy CLI is no longer actively maintained. For the best experience, use the new Docker-based web application (v2.0).
