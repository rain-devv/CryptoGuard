# ============================================================
# routers/crypto.py — AES Encrypt / Decrypt API Endpoints
# ============================================================
# This file defines two POST endpoints that the React frontend
# calls to encrypt and decrypt text using AES-256-CBC:
#
#   POST /api/crypto/encrypt   → receives plain text + key,
#                                returns encrypted base64 string.
#   POST /api/crypto/decrypt   → receives encrypted base64 + key,
#                                returns the original plain text.
#
# The actual AES logic lives in crypto_utils.py.
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from crypto_utils import aes_encrypt, aes_decrypt

# Create a router — this is registered in main.py under /api/crypto
router = APIRouter()


# ── Request Schemas ──────────────────────────────────────────
# Pydantic models automatically validate the incoming JSON body.

class EncryptRequest(BaseModel):
    """Body expected by the /encrypt endpoint."""
    text: str   # The plain text the user wants to encrypt
    key: str    # The secret passphrase (password) chosen by the user


class DecryptRequest(BaseModel):
    """Body expected by the /decrypt endpoint."""
    encrypted: str  # The base64-encoded AES ciphertext to decrypt
    key: str        # The secret passphrase used during encryption


# ── Encrypt Endpoint ─────────────────────────────────────────

@router.post("/encrypt")
def encrypt(req: EncryptRequest):
    """
    Encrypt plain text with AES-256-CBC using the given key.

    Validation rules (returns HTTP 400 if violated):
      • text  must not be empty or whitespace.
      • key   must not be empty or whitespace.
      • key   must be at least 4 characters long.

    On success returns: { "encrypted": "<base64 string>" }
    """
    # Guard: reject empty text
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال النص الأصلي")
    # Guard: reject empty key
    if not req.key.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال مفتاح التشفير")
    # Guard: key must be at least 4 characters (minimum reasonable security)
    if len(req.key) < 4:
        raise HTTPException(status_code=400, detail="مفتاح التشفير يجب أن يكون 4 أحرف على الأقل")
    try:
        encrypted = aes_encrypt(req.text, req.key)
        return {"encrypted": encrypted}
    except Exception as e:
        # Wrap unexpected errors so the frontend receives a clean message
        raise HTTPException(status_code=500, detail=f"فشل التشفير: {str(e)}")


# ── Decrypt Endpoint ─────────────────────────────────────────

@router.post("/decrypt")
def decrypt(req: DecryptRequest):
    """
    Decrypt an AES-256-CBC ciphertext using the given key.

    On success returns: { "decrypted": "<original plain text>" }

    If the key is wrong, pycryptodome will raise an exception
    (bad padding) which we catch and return as a 400 error so
    the user knows to try a different key.
    """
    # Guard: reject empty ciphertext field
    if not req.encrypted.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال النص المشفر")
    # Guard: reject empty key
    if not req.key.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال مفتاح فك التشفير")
    try:
        decrypted = aes_decrypt(req.encrypted, req.key)
        # Extra safety: if decryption returned an empty string, treat it as failure
        if not decrypted:
            raise HTTPException(status_code=400, detail="مفتاح فك التشفير غير صحيح أو النص ليس مشفراً بـ AES")
        return {"decrypted": decrypted}
    except HTTPException:
        # Re-raise our own HTTP exceptions without wrapping them again
        raise
    except Exception:
        # Any other exception (wrong key → bad padding) means decryption failed
        raise HTTPException(status_code=400, detail="مفتاح فك التشفير غير صحيح")
