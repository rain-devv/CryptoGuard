"""
routers/steganography.py — LSB Steganography API Endpoints
===========================================================
تحسين: إضافة التوزيع العشوائي للبتات باستخدام المفتاح كـ seed
هذا يجعل الإخفاء مقاوماً لأدوات Steganalysis لأن البتات
لا تُخزن بترتيب ثابت بل بترتيب عشوائي يعتمد على المفتاح.

POST /api/steganography/embed   → يخفي النص داخل الصورة
POST /api/steganography/extract → يستخرج النص المخفي
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import io
import random
import hashlib

router = APIRouter()
DELIMITER = "###END###"
WATERMARK_DELIMITER = "###WM###"
WATERMARK_KEY = "watermark_channel_green"  # مفتاح ثابت للبصمة


# ── تضمين البصمة الرقمية في القناة الخضراء ──────────────────

def _embed_watermark(pixels: list, username: str, total_pixels: int) -> list:
    """
    يخفي اسم المستخدم (البصمة) في القناة الخضراء (G) باستخدام LSB.
    هذا مستقل عن النص الرئيسي المخفي في القناة الحمراء (R).
    """
    watermark = username + WATERMARK_DELIMITER
    bits = _text_to_bits(watermark)
    if len(bits) > total_pixels:
        return pixels  # الصورة صغيرة جداً — لا نضيف بصمة

    # نستخدم seed ثابت للبصمة حتى يمكن استخراجها دائماً
    seed = int(hashlib.sha256(WATERMARK_KEY.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    indices = list(range(total_pixels))
    rng.shuffle(indices)
    pixel_indices = indices[:len(bits)]

    new_pixels = list(pixels)
    for bit, pixel_idx in zip(bits, pixel_indices):
        r, g, b, a = new_pixels[pixel_idx]
        g = (g & 0xFE) | bit  # نغير LSB في القناة الخضراء
        new_pixels[pixel_idx] = (r, g, b, a)
    return new_pixels


def _extract_watermark(pixels: list, total_pixels: int) -> str:
    """
    يستخرج البصمة الرقمية من القناة الخضراء.
    """
    max_bits = min(total_pixels, 2000)  # حد أقصى للبصمة
    seed = int(hashlib.sha256(WATERMARK_KEY.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    indices = list(range(total_pixels))
    rng.shuffle(indices)
    pixel_indices = indices[:max_bits]

    bits = [(pixels[idx][1] & 1) for idx in pixel_indices]  # القناة الخضراء
    text = _bits_to_text_wm(bits)
    if WATERMARK_DELIMITER in text:
        return text.split(WATERMARK_DELIMITER)[0]
    return ""


def _bits_to_text_wm(bits: list[int]) -> str:
    """تحويل بتات البصمة إلى نص."""
    chars = []
    for i in range(0, len(bits) - 15, 16):
        group = bits[i: i + 16]
        if len(group) < 16:
            break
        code = 0
        for b in group:
            code = (code << 1) | b
        if code == 0:
            break
        try:
            ch = chr(code)
            chars.append(ch)
        except Exception:
            break
        assembled = "".join(chars)
        if assembled.endswith(WATERMARK_DELIMITER):
            return assembled
    return "".join(chars)


# ── توليد ترتيب عشوائي للبكسلات بناءً على المفتاح ──────────

def _get_pixel_order(total_pixels: int, num_bits: int, key: str) -> list[int]:
    """
    يولّد قائمة بمواضع البكسلات بترتيب عشوائي بناءً على المفتاح.
    نفس المفتاح يعطي نفس الترتيب دائماً (Deterministic).
    """
    # نحول المفتاح لرقم seed باستخدام SHA-256
    seed = int(hashlib.sha256(key.encode("utf-8")).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    indices = list(range(total_pixels))
    rng.shuffle(indices)
    return indices[:num_bits]


# ── تحويل النص إلى بتات ─────────────────────────────────────

def _text_to_bits(text: str) -> list[int]:
    bits = []
    for ch in text:
        code = ord(ch)
        for shift in range(15, -1, -1):
            bits.append((code >> shift) & 1)
    return bits


# ── تحويل البتات إلى نص ─────────────────────────────────────

def _bits_to_text(bits: list[int]) -> str:
    chars = []
    for i in range(0, len(bits) - 15, 16):
        group = bits[i: i + 16]
        if len(group) < 16:
            break
        code = 0
        for b in group:
            code = (code << 1) | b
        if code == 0:
            break
        ch = chr(code)
        chars.append(ch)
        assembled = "".join(chars)
        if assembled.endswith(DELIMITER):
            return assembled[: -len(DELIMITER)]
    return "".join(chars)


# ── Embed Endpoint ───────────────────────────────────────────

@router.post("/embed")
async def embed(
    image: UploadFile = File(...),
    text: str = Form(...),
    key: str = Form(default="default_key"),
    username: str = Form(default="")
):
    """
    يخفي النص داخل الصورة باستخدام LSB مع توزيع عشوائي.

    التحسين: بدل تخزين البتات في بكسلات متتالية (١،٢،٣...)
    نخزنها في مواضع عشوائية تعتمد على المفتاح.
    هذا يجعل الإخفاء مقاوماً لأدوات Steganalysis.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="يرجى إدخال النص المراد إخفاؤه")

    try:
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=400, detail="يرجى اختيار ملف صورة صالح")

    pixels = list(img.getdata())
    total_pixels = len(pixels)

    message = text + DELIMITER
    bits = _text_to_bits(message)

    if len(bits) > total_pixels:
        raise HTTPException(
            status_code=400,
            detail="النص طويل جداً بالنسبة لحجم الصورة. استخدم صورة أكبر.",
        )

    # ── التوزيع العشوائي ──────────────────────────────────────
    # نحصل على مواضع عشوائية للبكسلات بناءً على المفتاح
    pixel_indices = _get_pixel_order(total_pixels, len(bits), key)

    new_pixels = list(pixels)
    for bit, pixel_idx in zip(bits, pixel_indices):
        r, g, b, a = new_pixels[pixel_idx]
        r = (r & 0xFE) | bit  # نغير LSB فقط في القناة الحمراء
        new_pixels[pixel_idx] = (r, g, b, a)

    # ── إضافة البصمة الرقمية في القناة الخضراء ──────────────
    if username.strip():
        new_pixels = _embed_watermark(new_pixels, username.strip(), total_pixels)

    out_img = Image.new("RGBA", img.size)
    out_img.putdata(new_pixels)

    buf = io.BytesIO()
    out_img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="stego-image.png"'},
    )


# ── Extract Endpoint ─────────────────────────────────────────

@router.post("/extract")
async def extract(
    image: UploadFile = File(...),
    key: str = Form(default="default_key")
):
    """
    يستخرج النص المخفي باستخدام نفس المفتاح والترتيب العشوائي.
    بدون المفتاح الصحيح لا يمكن استخراج النص.
    """
    try:
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=400, detail="يرجى اختيار ملف صورة صالح")

    pixels = list(img.getdata())
    total_pixels = len(pixels)

    # نحصل على نفس الترتيب العشوائي باستخدام نفس المفتاح
    # نقرأ كل البكسلات بنفس ترتيب الإخفاء
    max_bits = min(total_pixels, 80144)  # حد أقصى 5000 حرف
    pixel_indices = _get_pixel_order(total_pixels, max_bits, key)

    # نستخرج البتات من المواضع الصحيحة
    bits = [(pixels[idx][0] & 1) for idx in pixel_indices]

    message = _bits_to_text(bits)

    if not message:
        raise HTTPException(
            status_code=400,
            detail="فشل استخراج النص — مفتاح الإخفاء غير صحيح أو الصورة لا تحتوي على نص مخفي"
        )

    # تحقق من صحة النص قبل الإرسال
    try:
        message.encode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        raise HTTPException(
            status_code=400,
            detail="فشل استخراج النص — مفتاح الإخفاء غير صحيح أو الصورة لا تحتوي على نص مخفي"
        )

    return {"extracted_text": message}


# ── Watermark Extract Endpoint ───────────────────────────────

@router.post("/extract-watermark")
async def extract_watermark(image: UploadFile = File(...)):
    """
    يستخرج البصمة الرقمية (اسم المستخدم) من الصورة.
    يُستخدم للكشف عن مصدر تسرب الصورة.
    """
    try:
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=400, detail="يرجى اختيار ملف صورة صالح")

    pixels = list(img.getdata())
    total_pixels = len(pixels)
    watermark = _extract_watermark(pixels, total_pixels)

    if not watermark:
        raise HTTPException(status_code=400, detail="لم يتم العثور على بصمة رقمية في هذه الصورة")

    return {"watermark": watermark, "message": f"البصمة الرقمية تعود للمستخدم: {watermark}"}
