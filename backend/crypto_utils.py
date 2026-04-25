"""
crypto_utils.py — AES Encryption / Decryption Utilities
========================================================
Provides two public functions: aes_encrypt and aes_decrypt.

Why this file exists
--------------------
The React frontend previously used CryptoJS.AES.encrypt(text, passphrase).
CryptoJS uses a specific key-derivation scheme (OpenSSL EVP_BytesToKey with MD5)
that is NOT the same as the standard Python `cryptography` or `pycryptodome`
AES helpers.  This file replicates that exact scheme so that:
  • Text encrypted by the Python backend can be decrypted by CryptoJS in the
    browser, and vice-versa.

CryptoJS wire format
--------------------
  base64( b"Salted__" + 8-byte-salt + AES-CBC-ciphertext )

The 8-byte "Salted__" magic header is the standard OpenSSL format marker.
"""

import base64
import hashlib
import os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

# The magic prefix that OpenSSL / CryptoJS prepends to mark a salted ciphertext
SALT_MAGIC = b"Salted__"


# ── Key Derivation ───────────────────────────────────────────────────────────

def _evp_bytes_to_key(password: bytes, salt: bytes, key_len: int = 32, iv_len: int = 16) -> tuple[bytes, bytes]:
    """
    MD5-based key derivation — identical to CryptoJS / OpenSSL EVP_BytesToKey.

    How it works:
        Repeatedly hash (previous_hash + password + salt) with MD5 until we
        have enough bytes to fill both the AES key and the IV.
        • key_len = 32 bytes → AES-256
        • iv_len  = 16 bytes → one AES block

    Returns: (key, iv)  both as raw bytes.
    """
    d = b""       # accumulated derived bytes
    d_i = b""     # previous MD5 digest (starts empty)
    while len(d) < key_len + iv_len:
        # Each round: hash (previous_digest + password + salt)
        d_i = hashlib.md5(d_i + password + salt).digest()
        d += d_i
    # Split the derived bytes into key and IV
    return d[:key_len], d[key_len: key_len + iv_len]


# ── Public Encryption Function ───────────────────────────────────────────────

def aes_encrypt(plaintext: str, passphrase: str) -> str:
    """
    Encrypt *plaintext* with *passphrase* using AES-256-CBC.

    Steps:
        1. Generate a random 8-byte salt (different every call for security).
        2. Derive a 32-byte key and 16-byte IV from the passphrase + salt
           using _evp_bytes_to_key (same algorithm as CryptoJS).
        3. Encrypt the UTF-8 encoded plaintext with AES-CBC (PKCS#7 padding).
        4. Prepend the OpenSSL header:  b"Salted__" + salt
        5. Base64-encode the whole thing and return it as a string.

    The returned string is identical to what CryptoJS.AES.encrypt() produces,
    so the frontend can decrypt it with the same passphrase.
    """
    salt = os.urandom(8)  # Unique salt prevents identical outputs for same input
    key, iv = _evp_bytes_to_key(passphrase.encode("utf-8"), salt)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    # pad() adds PKCS#7 padding so the plaintext length is a multiple of 16
    ct = cipher.encrypt(pad(plaintext.encode("utf-8"), AES.block_size))
    # Build the full payload: magic + salt + ciphertext
    raw = SALT_MAGIC + salt + ct
    return base64.b64encode(raw).decode("utf-8")


# ── Public Decryption Function ───────────────────────────────────────────────

def aes_decrypt(ciphertext_b64: str, passphrase: str) -> str:
    """
    Decrypt a CryptoJS-produced (or aes_encrypt-produced) base64 ciphertext.

    Steps:
        1. Base64-decode the input.
        2. Check for the "Salted__" magic header (raises ValueError if missing).
        3. Extract the 8-byte salt (bytes 8–15) and the ciphertext (bytes 16+).
        4. Re-derive the same key and IV using the passphrase + extracted salt.
        5. Decrypt with AES-CBC and remove PKCS#7 padding.
        6. Return the original UTF-8 plaintext string.

    Raises ValueError if the ciphertext header is invalid.
    Raises Exception (propagated from pycryptodome) if the key is wrong.
    """
    raw = base64.b64decode(ciphertext_b64)
    # Validate the OpenSSL header
    if not raw.startswith(SALT_MAGIC):
        raise ValueError("Invalid ciphertext: missing OpenSSL Salted__ header")
    # Extract salt and actual ciphertext from the binary payload
    salt = raw[8:16]   # bytes 8-15
    ct   = raw[16:]    # everything after the header+salt
    key, iv = _evp_bytes_to_key(passphrase.encode("utf-8"), salt)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    # unpad() removes the PKCS#7 padding added during encryption
    plaintext = unpad(cipher.decrypt(ct), AES.block_size)
    return plaintext.decode("utf-8")
