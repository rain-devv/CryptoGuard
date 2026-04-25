from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import crypto, steganography, users

app = FastAPI(title="Safe Arabic Secrets API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8080", "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crypto.router, prefix="/api/crypto", tags=["Crypto"])
app.include_router(steganography.router, prefix="/api/steganography", tags=["Steganography"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

@app.get("/")
def root():
    return {"status": "ok", "message": "Safe Arabic Secrets API is running"}
