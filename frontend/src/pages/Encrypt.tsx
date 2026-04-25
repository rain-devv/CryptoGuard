import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Copy, Check, ArrowLeft, Shield, LogOut, Home, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useNavigate } from "react-router-dom";

// مؤشر الأمان
const SecurityPanel = ({ hasStrongKey }: { hasStrongKey: boolean }) => {
  const layers = [
    { label: "تشفير AES-256", active: true, weight: 35 },
    { label: "مفتاح قوي", active: hasStrongKey, weight: 15 },
    { label: "إخفاء في صورة", active: false, weight: 30 },
    { label: "التحقق من البصمة", active: false, weight: 20 },
  ];
  const score = layers.filter((l) => l.active).reduce((s, l) => s + l.weight, 0);
  const color = score < 40 ? "text-red-400" : score < 70 ? "text-yellow-400" : "text-primary";
  const bg = score < 40 ? "bg-red-500" : score < 70 ? "bg-yellow-500" : "bg-primary";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">مستوى أمان رسالتك</p>
        </div>
        <p className={`text-2xl font-black ${color}`}>{score}%</p>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <motion.div className={`h-full rounded-full ${bg}`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
      <div className="space-y-1.5">
        {layers.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            {l.active ? <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />}
            <p className={`text-xs ${l.active ? "text-foreground" : "text-muted-foreground/50"}`}>{l.label}</p>
            <p className={`text-xs mr-auto ${l.active ? color : "text-muted-foreground/40"}`}>+{l.weight}%</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-2">
        💡 فعّل باقي الطبقات في صفحة الإخفاء لرفع مستوى الأمان
      </p>
    </motion.div>
  );
};

const Encrypt = () => {
  const [plainText, setPlainText] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [success, setSuccess] = useState(false);
  const [strongKey, setStrongKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { username, logout, addOperation } = useAuth();
  const navigate = useNavigate();

  const handleEncrypt = async () => {
    if (!plainText.trim()) { setError("يرجى إدخال النص الأصلي"); addOperation({ type: "encrypt", label: "نص فارغ", success: false }); return; }
    if (!secretKey.trim()) { setError("يرجى إدخال مفتاح التشفير"); addOperation({ type: "encrypt", label: plainText.slice(0, 40), success: false }); return; }
    if (secretKey.length < 4) { setError("مفتاح التشفير يجب أن يكون 4 أحرف على الأقل"); addOperation({ type: "encrypt", label: plainText.slice(0, 40), success: false }); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/crypto/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText, key: secretKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "حدث خطأ أثناء التشفير");
        addOperation({ type: "encrypt", label: plainText.slice(0, 40), success: false });
        return;
      }
      const data = await res.json();
      setEncryptedText(data.encrypted);
      setStrongKey(secretKey.length >= 6);
      setSuccess(true);
      addOperation({ type: "encrypt", label: plainText.slice(0, 40), success: true });
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlainText(""); setSecretKey(""); setEncryptedText("");
    setSuccess(false); setError(""); setStrongKey(false);
  };

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container max-w-2xl mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground glow-text">تشفير النصوص</h1>
              <p className="text-sm text-muted-foreground">مرحباً، {username}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/home"); }} className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-sm px-3 py-2 rounded-lg hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </motion.div>

        {/* مؤشر الخطوات */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">١</div>
            <span className="text-sm text-primary font-bold">التشفير</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
            <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">٢</div>
            <span className="text-sm text-muted-foreground">الإخفاء في الصورة</span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-surface glow-border rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">تشفير AES</h2>
          </div>

          {/* النص */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">النص الأصلي</label>
            <textarea value={plainText} onChange={(e) => setPlainText(e.target.value)} rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="أدخل النص المراد تشفيره..." maxLength={5000} />
            <p className="text-xs text-muted-foreground text-left">{plainText.length}/5000</p>
          </div>

          {/* المفتاح */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">مفتاح التشفير</label>
            <input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="أدخل مفتاح التشفير" maxLength={100} />
            <p className="text-xs text-muted-foreground">⚠️ احتفظ بالمفتاح — ستحتاجه لفك التشفير لاحقاً</p>
          </div>

          {/* خطأ */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              <p className="text-destructive text-sm">⚠️ {error}</p>
            </motion.div>
          )}

          <button onClick={handleEncrypt} disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all glow-box disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />جاري التشفير...</> : <><Lock className="w-5 h-5" />تشفير باستخدام AES</>}
          </button>

          {/* النتيجة */}
          <AnimatePresence>
            {success && encryptedText && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold">تم التشفير بنجاح!</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">النص المشفر</label>
                  <div className="relative">
                    <textarea readOnly value={encryptedText} rows={4}
                      className="w-full bg-secondary/50 border border-primary/20 rounded-xl px-4 py-3 text-foreground text-sm font-mono resize-none" dir="ltr" />
                    <button onClick={async () => { await navigator.clipboard.writeText(encryptedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="absolute top-3 left-3 p-1.5 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all">
                      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <SecurityPanel hasStrongKey={strongKey} />

                <div className="flex gap-3">
                  <button onClick={() => navigate("/steganography", { state: { encryptedText } })}
                    className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all glow-box flex items-center justify-center gap-2">
                    التالي - الإخفاء في الصورة
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => navigate("/home")} className="px-4 bg-secondary py-3 rounded-xl hover:opacity-80 transition-all border border-border flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </button>
                  <button onClick={handleReset} className="px-4 bg-secondary font-bold py-3 rounded-xl hover:opacity-90 transition-all border border-border">
                    جديد
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Encrypt;
