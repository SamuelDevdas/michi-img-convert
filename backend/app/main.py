from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Michi Image Converter API", version="2.0.0")

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
    return {"status": "System Ready", "message": "Michi Image Converter Backend v2.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "docker": True}
