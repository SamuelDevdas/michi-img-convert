FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for LibRaw/exiftool
# Note: On Debian, exiftool is provided by libimage-exiftool-perl package
RUN apt-get update && apt-get install -y \
    libexif-dev \
    libimage-exiftool-perl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Install python dependencies using uv
COPY pyproject.toml .
RUN uv pip install --system \
    fastapi \
    uvicorn \
    rawpy \
    imageio \
    pillow \
    python-multipart \
    websockets

# Copy source code
COPY . .

# Run application
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
