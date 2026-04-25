# ============================================================
# routers/users.py — User Authentication API
# ============================================================
# POST /api/users/register → تسجيل حساب جديد
# POST /api/users/login    → تسجيل الدخول
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import hashlib
import os

router = APIRouter()

# مسار قاعدة البيانات
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database.db")

# ── إنشاء قاعدة البيانات ─────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            locked_until REAL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# تشغيل إنشاء الجدول عند بدء التطبيق
init_db()

# ── تشفير كلمة السر ──────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# ── Schemas ──────────────────────────────────────────────────
class UserRequest(BaseModel):
    username: str
    password: str

# ── تسجيل حساب جديد ─────────────────────────────────────────
@router.post("/register")
def register(req: UserRequest):
    if not req.username.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال اسم المستخدم")
    if not req.password.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال كلمة السر")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="كلمة السر يجب أن تكون 4 أحرف على الأقل")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (req.username.strip(), hash_password(req.password))
        )
        conn.commit()
        return {"success": True, "username": req.username.strip()}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود مسبقاً")
    finally:
        conn.close()

# ── تسجيل الدخول ─────────────────────────────────────────────
@router.post("/login")
def login(req: UserRequest):
    import time

    if not req.username.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="يرجى ملء جميع الحقول")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT password_hash, failed_attempts, locked_until FROM users WHERE username = ?",
            (req.username.strip(),)
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="اسم المستخدم أو كلمة السر غير صحيحة")

        password_hash, failed_attempts, locked_until = row

        # تحقق من الإقفال
        if locked_until and time.time() < locked_until:
            remaining = int((locked_until - time.time()) / 60) + 1
            raise HTTPException(
                status_code=400,
                detail=f"🔒 الحساب مقفل لمدة {remaining} دقيقة بسبب محاولات متعددة خاطئة"
            )

        # تحقق من كلمة السر
        if password_hash != hash_password(req.password):
            new_attempts = failed_attempts + 1
            if new_attempts >= 5:
                locked_until_time = time.time() + (5 * 60)
                cursor.execute(
                    "UPDATE users SET failed_attempts = ?, locked_until = ? WHERE username = ?",
                    (new_attempts, locked_until_time, req.username.strip())
                )
                conn.commit()
                raise HTTPException(
                    status_code=400,
                    detail="🔒 تم قفل الحساب لمدة 5 دقائق بسبب محاولات متعددة خاطئة"
                )
            else:
                cursor.execute(
                    "UPDATE users SET failed_attempts = ? WHERE username = ?",
                    (new_attempts, req.username.strip())
                )
                conn.commit()
                remaining = 5 - new_attempts
                raise HTTPException(
                    status_code=400,
                    detail=f"اسم المستخدم أو كلمة السر غير صحيحة — تبقى {remaining} محاولة"
                )

        # نجح تسجيل الدخول — صفر المحاولات
        cursor.execute(
            "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = ?",
            (req.username.strip(),)
        )
        conn.commit()
        return {"success": True, "username": req.username.strip()}

    finally:
        conn.close()
