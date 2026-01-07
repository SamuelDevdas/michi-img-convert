from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Spectrum API",
    version="2.0.0",
    description="Professional RAW image conversion API by TrueVine Insights",
)

# CORS setup for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "Spectrum API",
        "version": "2.0.0",
        "status": "Ready",
        "message": "Professional RAW image converter by TrueVine Insights",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "docker": True}
