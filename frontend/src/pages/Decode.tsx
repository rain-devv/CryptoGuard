// ============================================================
// Decode.tsx — فك الإخفاء + فك التشفير
// ============================================================
// خطوتان مرتبتان في صفحة واحدة:
//  الخطوة 1: فك الإخفاء — رفع الصورة واستخراج النص المخفي
//  الخطوة 2: فك التشفير — إدخال المفتاح وفك تشفير النص
//  النتيجة:  عرض النص الأصلي
// ============================================================

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Unlock,
  Upload,
  Eye,
  EyeOff,
  Shield,
  LogOut,
  Check,
  Copy,
  ArrowDown,
  Key,
  FileSearch,
  Sparkles,
  RefreshCw,
  Lock,
  Home,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useNavigate } from "react-router-dom";

// ── حركة الانتقال بين الخطوات ─────────────────────────────
const stepVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.25 } },
};

type Step = "upload" | "extracted" | "decrypted";

const Decode = () => {
  // ── State ──────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingDecrypt, setLoadingDecrypt] = useState(false);
  const [stegoKey, setStegoKey] = useState("");
  const [enableHashCheck, setEnableHashCheck] = useState(false);
  const [watermark, setWatermark] = useState("");
  const [loadingWatermark, setLoadingWatermark] = useState(false);
  const [expectedHash, setExpectedHash] = useState("");
  const [hashResult, setHashResult] = useState<"match" | "mismatch" | null>(null);
  const [extractTime, setExtractTime] = useState<Date | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<{ hasExpiry: boolean; expiryDate: Date | null }>({ hasExpiry: false, expiryDate: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { username, logout, addOperation } = useAuth();
  const navigate = useNavigate();

  // ── مؤشر الخطوات ──────────────────────────────────────────
  const steps = [
    { id: "upload", label: "فك الإخفاء", icon: Eye },
    { id: "extracted", label: "فك التشفير", icon: Key },
    { id: "decrypted", label: "النتيجة", icon: Sparkles },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  // ── Handler: رفع الصورة ────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  // حساب SHA-256
  const computeSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // ── Handler: فك الإخفاء — استخراج النص من الصورة ──────────
  const extractTextFromImage = async () => {
    if (!imageFile) {
      setError("يرجى رفع الصورة أولاً");
      return;
    }
    setLoadingExtract(true);
    setError("");

    // التحقق من Hash إذا كان مفعلاً
    if (enableHashCheck && expectedHash.trim()) {
      const actualHash = await computeSHA256(imageFile);
      if (actualHash !== expectedHash.trim().toLowerCase()) {
        setHashResult("mismatch");
        setError("البصمة لا تتطابق! الصورة تعرضت للتعديل أو هي صورة مختلفة.");
        setLoadingExtract(false);
        return;
      }
      setHashResult("match");
    }
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("key", stegoKey || "default_key");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20 ثانية timeout

      const res = await fetch("/api/steganography/extract", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "حدث خطأ أثناء استخراج النص");
        return;
      }

      const data = await res.json();
      let extractedRaw = data.extracted_text;

      // تحقق من انتهاء الصلاحية
      if (extractedRaw.startsWith("EXPIRY:")) {
        const [expiryPart, ...rest] = extractedRaw.replace("EXPIRY:", "").split("||");
        const expiryDate = new Date(expiryPart);
        setExpiryInfo({ hasExpiry: true, expiryDate });
        if (Date.now() > expiryDate.getTime()) {
          setError(`⏰ انتهت صلاحية هذه الرسالة منذ ${expiryDate.toLocaleString("ar-SA")}`);
          addOperation({ type: "extract", label: imageFile?.name || "صورة", success: false });
          return;
        }
        extractedRaw = rest.join("||");
      } else {
        setExpiryInfo({ hasExpiry: false, expiryDate: null });
      }

      setExtractTime(new Date());
      setExtractedText(extractedRaw);
      setStep("extracted");
      addOperation({ type: "extract", label: imageFile?.name || "صورة", success: true });
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند.");
    } finally {
      setLoadingExtract(false);
    }
  };

  // ── Handler: فك التشفير ────────────────────────────────────
  const handleDecrypt = async () => {
    if (!decryptionKey.trim()) {
      setError("يرجى إدخال مفتاح فك التشفير");
      return;
    }
    setLoadingDecrypt(true);
    setError("");
    try {
      const res = await fetch("/api/crypto/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted: extractedText, key: decryptionKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "مفتاح فك التشفير غير صحيح أو النص ليس مشفراً بـ AES");
        return;
      }

      const data = await res.json();
      setDecryptedText(data.decrypted);
      setStep("decrypted");
      addOperation({ type: "decrypt", label: "فك تشفير نص", success: true });
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند.");
    } finally {
      setLoadingDecrypt(false);
    }
  };

  // ── Handler: نسخ النص ──────────────────────────────────────
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Handler: تسجيل الخروج ─────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Handler: كشف البصمة الرقمية ────────────────────────────
  const handleDetectWatermark = async () => {
    if (!imageFile) return;
    setLoadingWatermark(true);
    setWatermark("");
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch("/api/steganography/extract-watermark", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        setWatermark("لم يتم العثور على بصمة رقمية في هذه الصورة");
        return;
      }
      const data = await res.json();
      setWatermark(data.watermark);
    } catch {
      setWatermark("تعذر الاتصال بالخادم");
    } finally {
      setLoadingWatermark(false);
    }
  };

  // ── Handler: إعادة البدء ──────────────────────────────────
  const handleReset = () => {
    setImageFile(null);
    setImagePreview("");
    setExtractedText("");
    setDecryptionKey("");
    setDecryptedText("");
    setStep("upload");
    setError("");
    setEnableHashCheck(false);
    setExpectedHash("");
    setHashResult(null);
    setExtractTime(null);
    setExpiryInfo({ hasExpiry: false, expiryDate: null });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="gradient-mesh relative overflow-hidden">
      {/* خلفية متوهجة زخرفية */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-primary/6 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-500/4 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

      <div className="container max-w-2xl mx-auto px-4 py-8 relative z-10">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground glow-text">فك الإخفاء والتشفير</h1>
              {/* <p className="text-sm text-muted-foreground">مرحباً، {username}</p> */}
            </div>
          </div>
          {/* <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-sm px-3 py-2 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button> */}
        </div>

        {/* ── Step Indicator ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div key={s.id} className="flex items-center flex-1">
                {/* دائرة الخطوة */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      backgroundColor: isDone
                        ? "hsl(174 72% 50%)"
                        : isCurrent
                          ? "hsl(174 72% 50% / 0.15)"
                          : "hsl(222 30% 16%)",
                      borderColor: isDone || isCurrent
                        ? "hsl(174 72% 50%)"
                        : "hsl(222 30% 25%)",
                      boxShadow: isCurrent
                        ? "0 0 16px hsl(174 72% 50% / 0.4)"
                        : "none",
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${isCurrent ? "text-primary" : "text-muted-foreground"
                          }`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${isCurrent
                      ? "text-primary"
                      : isDone
                        ? "text-primary/70"
                        : "text-muted-foreground"
                      }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* خط الرابط بين الخطوات */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 mb-5">
                    <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: idx < stepIndex ? "100%" : "0%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Main Card ───────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════════════
              الخطوة 1: فك الإخفاء
          ═══════════════════════════════════════════════════ */}
          {step === "upload" && (
            <motion.div
              key="step-upload"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-surface glow-border rounded-2xl p-8 space-y-6"
            >
              {/* عنوان القسم */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">فك الإخفاء</h2>
                  <p className="text-xs text-muted-foreground">استخراج النص المخفي من الصورة</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* منطقة رفع الصورة */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">الصورة المحتوية على النص المخفي</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-all bg-secondary/30 group min-h-[160px]"
                >
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="الصورة المرفوعة"
                        className="max-h-44 rounded-lg object-contain border border-border"
                      />
                      <span className="text-xs text-muted-foreground">{imageFile?.name}</span>
                      <span className="text-xs text-primary/70 group-hover:text-primary transition-colors">
                        اضغط لاختيار صورة أخرى
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center group-hover:border-primary/40 transition-all">
                        <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">اضغط لرفع الصورة</p>
                        {/* <p className="text-muted-foreground/50 text-xs mt-1">PNG فقط (لأن JPG يفسد البيانات المخفية)</p> */}
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* التحقق من Hash */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-foreground">التحقق من سلامة الصورة</p>
                      <p className="text-xs text-muted-foreground">تحقق إذا الصورة أصلية أو تم تعديلها</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEnableHashCheck(!enableHashCheck); setHashResult(null); }}
                    className={`w-12 h-6 rounded-full transition-all relative ${enableHashCheck ? "bg-primary" : "bg-secondary border border-border"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enableHashCheck ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {enableHashCheck && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-muted-foreground">أدخل بصمة الصورة الأصلية (SHA-256)</label>
                      <input
                        type="text"
                        value={expectedHash}
                        onChange={(e) => { setExpectedHash(e.target.value); setHashResult(null); }}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
                        placeholder="الصق بصمة SHA-256 هنا..."
                        dir="ltr"
                      />
                      {hashResult === "match" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <p className="text-sm font-bold">✅ البصمة متطابقة — الصورة أصلية</p>
                        </motion.div>
                      )}
                      {hashResult === "mismatch" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          <p className="text-sm font-bold">❌ البصمة لا تتطابق — الصورة تعرضت للتعديل</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* مفتاح الإخفاء */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">مفتاح الإخفاء (Stego Key)</label>
                <input
                  type="text"
                  value={stegoKey}
                  onChange={(e) => setStegoKey(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="أدخل نفس مفتاح الإخفاء المستخدم عند الإخفاء"
                />
                <p className="text-xs text-muted-foreground">🔀 يجب أن يكون نفس المفتاح المستخدم عند إخفاء النص</p>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 space-y-1"
                >
                  <p className="text-destructive text-sm font-bold">⚠️ فشل استخراج البيانات</p>
                  <p className="text-destructive/80 text-xs">{error}</p>
                  {(error.includes("مفتاح") || error.includes("فشل")) && (
                    <p className="text-xs text-muted-foreground mt-1">💡 تأكد من إدخال نفس مفتاح الإخفاء المستخدم عند الإخفاء</p>
                  )}
                </motion.div>
              )}

              <button
                onClick={extractTextFromImage}
                disabled={loadingExtract || !imageFile}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-all glow-box disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingExtract ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري الاستخراج...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5" />
                    استخراج النص المخفي
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              الخطوة 2: فك التشفير
          ═══════════════════════════════════════════════════ */}
          {step === "extracted" && (
            <motion.div
              key="step-extracted"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-surface glow-border rounded-2xl p-8 space-y-6"
            >
              {/* إشعار نجاح فك الإخفاء */}
              <div className="bg-primary/10 border border-primary/25 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-primary font-bold text-sm">تم فك الإخفاء بنجاح!</p>
                  <p className="text-primary/70 text-xs">تم استخراج النص المخفي من الصورة. الآن قم بفك تشفيره.</p>
                </div>
              </div>

              {/* عنوان القسم */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">فك التشفير</h2>
                  <p className="text-xs text-muted-foreground">أدخل المفتاح لفك تشفير النص المستخرج</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* النص المشفر المستخرج */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">النص المشفر المستخرج من الصورة</label>
                  <button
                    onClick={() => handleCopy(extractedText)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    title="نسخ النص المشفر"
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5 text-primary" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ</>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={extractedText}
                    rows={4}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-foreground text-sm font-mono resize-none opacity-80 select-all"
                    dir="ltr"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-border/40" />
                </div>
              </div>

              {/* سهم للأسفل */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <ArrowDown className="w-5 h-5 text-primary/50 animate-bounce" />
                </div>
              </div>

              {/* حقل مفتاح فك التشفير */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  مفتاح فك التشفير
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pe-12"
                    placeholder="أدخل المفتاح المستخدم في التشفير"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    title={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* رسالة الخطأ */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 space-y-1"
                  >
                    <p className="text-destructive text-sm font-bold">⚠️ فشل استخراج البيانات</p>
                    <p className="text-destructive/80 text-xs">{error}</p>
                    {(error.includes("مفتاح") || error.includes("فشل")) && (
                      <p className="text-xs text-muted-foreground mt-1">💡 تأكد من إدخال نفس مفتاح الإخفاء المستخدم عند الإخفاء</p>
                    )}
                    {error.includes("نص مخفي") && (
                      <p className="text-xs text-muted-foreground mt-1">💡 تأكد أن الصورة تحتوي على بيانات مخفية وأنها لم تتعرض للضغط</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* أزرار الخطوة 2 */}
              <div className="flex gap-3">
                <button
                  onClick={handleDecrypt}
                  disabled={loadingDecrypt || !decryptionKey.trim()}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-all glow-box disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingDecrypt ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جاري فك التشفير...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      فك التشفير
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 bg-secondary text-secondary-foreground font-bold py-3.5 rounded-xl hover:opacity-80 transition-all border border-border"
                  title="البدء من جديد"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              الخطوة 3: النتيجة النهائية
          ═══════════════════════════════════════════════════ */}
          {step === "decrypted" && (
            <motion.div
              key="step-decrypted"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-surface glow-border rounded-2xl p-8 space-y-6"
            >
              {/* بانر النجاح */}
              <div className="text-center py-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 12 }}
                  className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4 glow-box"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">تم بنجاح! 🎉</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  تم فك الإخفاء والتشفير بنجاح وظهر النص الأصلي
                </p>
              </div>

              <div className="h-px bg-border" />

              {/* ── تقرير السلامة الشامل ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">تقرير السلامة الشامل</p>
                </div>

                {/* بطاقات التقرير */}
                <div className="grid grid-cols-1 gap-2">

                  {/* سلامة الصورة */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${hashResult === "match" ? "bg-green-400/10 border-green-400/20" : hashResult === "mismatch" ? "bg-destructive/10 border-destructive/20" : "bg-secondary/50 border-border"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${hashResult === "match" ? "bg-green-400/20" : hashResult === "mismatch" ? "bg-destructive/20" : "bg-secondary"}`}>
                      <Hash className={`w-4 h-4 ${hashResult === "match" ? "text-green-400" : hashResult === "mismatch" ? "text-destructive" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">سلامة الصورة</p>
                      <p className="text-xs text-muted-foreground">
                        {hashResult === "match" ? "✅ الصورة أصلية — البصمة متطابقة" :
                         hashResult === "mismatch" ? "❌ الصورة معدّلة — البصمة مختلفة" :
                         "⚪ لم يتم التحقق من البصمة"}
                      </p>
                    </div>
                  </div>

                  {/* صلاحية الرسالة */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${expiryInfo.hasExpiry ? "bg-primary/10 border-primary/20" : "bg-secondary/50 border-border"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${expiryInfo.hasExpiry ? "bg-primary/20" : "bg-secondary"}`}>
                      <Clock className={`w-4 h-4 ${expiryInfo.hasExpiry ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">صلاحية الرسالة</p>
                      <p className="text-xs text-muted-foreground">
                        {expiryInfo.hasExpiry && expiryInfo.expiryDate
                          ? `✅ صالحة حتى: ${expiryInfo.expiryDate.toLocaleString("ar-SA")}`
                          : "⚪ بدون تحديد وقت انتهاء"}
                      </p>
                    </div>
                  </div>

                  {/* نوع التشفير */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-primary/10 border-primary/20">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">نوع التشفير</p>
                      <p className="text-xs text-muted-foreground">✅ AES-256 — خوارزمية تشفير متقدمة</p>
                    </div>
                  </div>

                  {/* طريقة الإخفاء */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-primary/10 border-primary/20">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">طريقة الإخفاء</p>
                      <p className="text-xs text-muted-foreground">✅ LSB Steganography — غير مرئي للعين</p>
                    </div>
                  </div>

                  {/* وقت الاستخراج */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/50 border-border">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">وقت الاستخراج</p>
                      <p className="text-xs text-muted-foreground">
                        {extractTime ? `📅 ${extractTime.toLocaleString("ar-SA")}` : "—"}
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>

              <div className="h-px bg-border" />
              <div className="space-y-3">
                {/* النص المشفر */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    النص المشفر (المستخرج من الصورة)
                  </label>
                  <textarea
                    readOnly
                    value={extractedText}
                    rows={3}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm font-mono text-muted-foreground resize-none opacity-60"
                    dir="ltr"
                  />
                </div>

                {/* السهم */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <ArrowDown className="w-4 h-4 text-primary/60" />
                    <span className="text-xs text-primary/60 font-medium">فك التشفير</span>
                    <ArrowDown className="w-4 h-4 text-primary/60" />
                  </div>
                </div>

                {/* النص الأصلي */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-primary uppercase tracking-wider">
                      النص الأصلي ✨
                    </label>
                    <button
                      onClick={() => handleCopy(decryptedText)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5 text-primary" /> تم النسخ</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> نسخ</>
                      )}
                    </button>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-primary/8 border-2 border-primary/30 rounded-xl px-5 py-4 glow-box"
                  >
                    <p className="text-foreground text-lg font-medium leading-relaxed break-words">
                      {decryptedText}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* أزرار النهاية */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-all glow-box flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  العودة للرئيسية
                </button>
                <button
                  onClick={handleReset}
                  className="w-full bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:opacity-80 transition-all border border-border flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  فك إخفاء صورة أخرى
                </button>

                {/* كشف البصمة الرقمية */}
                <div className="pt-2 border-t border-border space-y-3">
                  <button
                    onClick={handleDetectWatermark}
                    disabled={loadingWatermark}
                    className="w-full bg-secondary border border-border text-foreground font-bold py-3 rounded-xl hover:border-primary/40 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loadingWatermark
                      ? <><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />جاري الكشف...</>
                      : <><Shield className="w-4 h-4 text-primary" />كشف البصمة الرقمية</>
                    }
                  </button>
                  {watermark && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`rounded-xl px-4 py-3 text-sm ${watermark.includes("لم") ? "bg-secondary border border-border text-muted-foreground" : "bg-primary/10 border border-primary/20"}`}>
                      {watermark.includes("لم")
                        ? <p>{watermark}</p>
                        : <><p className="font-bold text-foreground">🔍 تم اكتشاف البصمة!</p>
                           <p className="text-xs text-muted-foreground mt-1">هذه الصورة تعود للمستخدم: <span className="text-primary font-bold">{watermark}</span></p></>
                      }
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Decode;
