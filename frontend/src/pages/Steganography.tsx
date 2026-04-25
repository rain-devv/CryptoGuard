import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Upload, Shield, LogOut, Check, FileImage, Home, RefreshCw, Clock, Copy, Hash, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

// مؤشر الأمان المصغّر
const SecurityPanel = ({ hasExpiry, hasHash, hasStegoKey }: { hasExpiry: boolean; hasHash: boolean; hasStegoKey: boolean }) => {
  const layers = [
    { label: "تشفير AES-256", active: true, weight: 30 },
    { label: "إخفاء في صورة", active: true, weight: 25 },
    { label: "مفتاح الإخفاء", active: hasStegoKey, weight: 10 },
    { label: "انتهاء الصلاحية", active: hasExpiry, weight: 20 },
    { label: "التحقق من البصمة", active: hasHash, weight: 15 },
  ];
  const score = layers.filter((l) => l.active).reduce((s, l) => s + l.weight, 0);
  const color = score < 55 ? "text-yellow-400" : score < 85 ? "text-blue-400" : "text-primary";
  const bg = score < 55 ? "bg-yellow-500" : score < 85 ? "bg-blue-500" : "bg-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">مستوى أمان رسالتك الآن</p>
        </div>
        <p className={`text-2xl font-black ${color}`}>{score}%</p>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bg}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-1.5">
        {layers.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            {l.active
              ? <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            }
            <p className={`text-xs ${l.active ? "text-foreground" : "text-muted-foreground/50"}`}>{l.label}</p>
            <p className={`text-xs mr-auto ${l.active ? color : "text-muted-foreground/40"}`}>+{l.weight}%</p>
          </div>
        ))}
      </div>
      {score === 100 && (
        <p className="text-xs text-primary border-t border-border pt-2 text-center font-bold">
          🏆 رسالتك محمية بالكامل بجميع الطبقات!
        </p>
      )}
    </motion.div>
  );
};

// حساب SHA-256 للصورة
const computeSHA256 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const Steganography = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [text, setText] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [stegoKey, setStegoKey] = useState("");

  // ميزة انتهاء الصلاحية
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { username, logout, addOperation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const encryptedFromPrev = (location.state as any)?.encryptedText || "";

  useState(() => {
    if (encryptedFromPrev && !text) setText(encryptedFromPrev);
  });

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setError(""); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  // دمج النص مع تاريخ الانتهاء
  const buildPayload = () => {
    if (!enableExpiry || !expiryDate || !expiryTime) return text;
    const expiryISO = new Date(`${expiryDate}T${expiryTime}`).toISOString();
    return `EXPIRY:${expiryISO}||${text}`;
  };

  const encodeTextInImage = async () => {
    if (!imageFile) { setError("يرجى رفع صورة أولاً"); return; }
    if (!text.trim()) { setError("يرجى إدخال النص المراد إخفاؤه"); return; }
    if (enableExpiry && (!expiryDate || !expiryTime)) {
      setError("يرجى تحديد تاريخ ووقت الانتهاء");
      return;
    }
    if (enableExpiry && new Date(`${expiryDate}T${expiryTime}`) <= new Date()) {
      setError("يجب أن يكون تاريخ الانتهاء في المستقبل");
      return;
    }

    setLoading(true); setError("");
    try {
      const payload = buildPayload();
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("text", payload);
      formData.append("key", stegoKey || "default_key");
      formData.append("username", username || "");
      const res = await fetch("/api/steganography/embed", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "حدث خطأ أثناء عملية الإخفاء في الصورة");
        return;
      }
      const blob = await res.blob();
      const hash = await computeSHA256(blob);
      setImageHash(hash);
      setResultUrl(URL.createObjectURL(blob));
      setSuccess(true);
      addOperation({ type: "steganography", label: text.slice(0, 40), success: true });
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "stego-image.png";
    link.href = resultUrl;
    link.click();
  };

  const handleReset = () => {
    setImageFile(null); setImagePreview(""); setText("");
    setResultUrl(""); setSuccess(false); setError("");
    setImageHash(""); setCopiedHash(false); setStegoKey("");
    setEnableExpiry(false); setExpiryDate(""); setExpiryTime("");
  };

  // الحد الأدنى للتاريخ (اليوم)
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="gradient-mesh relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container max-w-2xl mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground glow-text">إخفاء في الصورة</h1>
              {/* <p className="text-sm text-muted-foreground">مرحباً، {username}</p> */}
            </div>
          </div>
          {/* <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-sm px-3 py-2 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button> */}
        </motion.div>

        {/* Steps indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">١</div>
            <span className="text-sm text-muted-foreground">التشفير</span>
          </div>
          <div className="w-8 h-px bg-primary/30" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">٢</div>
            <span className="text-sm text-primary font-bold">إخفاء في الصورة</span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-surface glow-border rounded-2xl p-8 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Eye className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">إخفاء النص داخل الصورة</h2>
          </div>

          {/* رفع الصورة */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">رفع الصورة</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : imagePreview
                  ? "border-primary/40 bg-secondary/30"
                  : "border-border hover:border-primary/50 bg-secondary/50"
              }`}
            >
              {imagePreview ? (
                <div className="text-center space-y-3">
                  <img src={imagePreview} alt="الصورة المختارة" className="max-h-48 rounded-lg object-contain mx-auto" />
                  <p className="text-xs text-muted-foreground">{imageFile?.name}</p>
                  <p className="text-xs text-primary">اضغط لتغيير الصورة</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">اضغط لرفع صورة أو اسحبها هنا</p>
                  <p className="text-muted-foreground/60 text-xs">PNG, JPG, WEBP</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} className="hidden" />
          </div>

          {/* النص */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">النص المراد إخفاؤه</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none text-sm font-mono"
              placeholder="أدخل النص المشفر أو أي نص تريد إخفاءه..."
              dir="ltr"
            />
          </div>

          {/* مفتاح الإخفاء */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">مفتاح الإخفاء (Stego Key)</label>
            <input
              type="text"
              value={stegoKey}
              onChange={(e) => setStegoKey(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="أدخل مفتاح الإخفاء"
            />
            <p className="text-xs text-muted-foreground">🔀 يوزع البيانات عشوائياً في الصورة — يجب استخدام نفس المفتاح عند الاستخراج</p>
          </div>

          {/* ── ميزة انتهاء الصلاحية ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">تحديد وقت انتهاء الصلاحية</p>
                  <p className="text-xs text-muted-foreground">الرسالة لن تُقرأ بعد هذا الوقت</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableExpiry(!enableExpiry)}
                className={`w-12 h-6 rounded-full transition-all relative ${enableExpiry ? "bg-primary" : "bg-secondary border border-border"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enableExpiry ? "left-6" : "left-0.5"}`} />
              </button>
            </div>

            <AnimatePresence>
              {enableExpiry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">📅 التاريخ</label>
                    <input
                      type="date"
                      value={expiryDate}
                      min={todayStr}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">⏰ الوقت</label>
                    <input
                      type="time"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  {expiryDate && expiryTime && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3"
                    >
                      <p className="text-primary text-sm text-center">
                        ⏳ تنتهي صلاحية الرسالة في: <span className="font-bold">{new Date(`${expiryDate}T${expiryTime}`).toLocaleString("ar-SA")}</span>
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 space-y-1"
            >
              <p className="text-destructive text-sm font-bold">⚠️ فشل الإخفاء</p>
              <p className="text-destructive/80 text-xs">{error}</p>
              {error.includes("طويل") && (
                <p className="text-xs text-muted-foreground mt-1">💡 جرب صورة أكبر أو نصاً أقصر</p>
              )}
            </motion.div>
          )}

          <button
            onClick={encodeTextInImage}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all glow-box disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                جاري الإخفاء في الصورة......
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                إخفاء النص في الصورة داخل الصورة
              </>
            )}
          </button>

          {/* النتيجة */}
          <AnimatePresence>
            {success && resultUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-border"
              >
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold">تم الإخفاء في الصورة بنجاح!</span>
                </div>

                {enableExpiry && expiryDate && expiryTime && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                    <p className="text-primary text-sm text-center">
                      🔒 الرسالة ستنتهي في: <span className="font-bold">{new Date(`${expiryDate}T${expiryTime}`).toLocaleString("ar-SA")}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">مقارنة قبل وبعد الإخفاء</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-center text-muted-foreground font-bold">قبل الإخفاء</p>
                      <div className="rounded-xl border border-border overflow-hidden bg-secondary/30 p-2">
                        <img src={imagePreview} alt="الصورة الأصلية" className="max-h-48 rounded-lg object-contain mx-auto" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-center text-primary font-bold">بعد الإخفاء ✅</p>
                      <div className="rounded-xl border border-primary/20 overflow-hidden bg-secondary/30 p-2">
                        <img src={resultUrl} alt="الصورة مع النص المخفي" className="max-h-48 rounded-lg object-contain mx-auto" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">لا يوجد فرق مرئي بين الصورتين — النص مخفي بشكل غير محسوس 🔍</p>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all glow-box flex items-center justify-center gap-2"
                >
                  <FileImage className="w-5 h-5" />
                  تحميل الصورة
                </button>

                {/* البصمة الرقمية */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">البصمة الرقمية مضمّنة ✅</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تم تضمين بصمة رقمية خفية باسم <span className="text-primary font-bold">{username}</span> داخل الصورة.
                    لو تسربت الصورة يمكن معرفة مصدرها.
                  </p>
                </motion.div>

                {/* Hash الصورة */}
                {imageHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <label className="text-sm font-bold text-foreground">بصمة الصورة (SHA-256)</label>
                    </div>
                    <div className="bg-secondary/50 border border-primary/20 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">احتفظ بهذه البصمة للتحقق من سلامة الصورة لاحقاً:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-primary break-all flex-1" dir="ltr">{imageHash}</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(imageHash);
                            setCopiedHash(true);
                            setTimeout(() => setCopiedHash(false), 2000);
                          }}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        >
                          {copiedHash ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">⚠️ إذا تغيرت هذه البصمة عند فك الإخفاء، فالصورة تعرضت للتعديل</p>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:opacity-80 transition-all border border-border flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    الرئيسية
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:opacity-80 transition-all border border-border flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    جديد
                  </button>
                </div>

                {/* مؤشر الأمان التلقائي */}
                <SecurityPanel hasExpiry={enableExpiry && !!expiryDate && !!expiryTime} hasHash={!!imageHash} hasStegoKey={!!stegoKey} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Steganography;
