import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Eye, Unlock, ArrowLeft, ArrowRight,
  CheckCircle, Home, ChevronDown, ChevronUp, Shuffle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── بيانات الخطوات ──────────────────────────────────────────
const steps = [
  {
    number: "١",
    icon: Lock,
    title: "تشفير النص",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    description: "أدخل النص الذي تريد حمايته واختر مفتاح سري. سيتحول النص إلى رموز مشفرة باستخدام خوارزمية AES-256.",
    tip: " احتفظ بالمفتاح السري في مكان آمن — ستحتاجه لاحقاً لفك التشفير.",
    example: {
      input: "مرحباً، هذه رسالة سرية!",
      output: "U2FsdGVkX1+abc123XYZ789...==",
    },
  },
  {
    number: "٢",
    icon: Eye,
    title: "إخفاء النص في صورة",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    description: "ارفع صورة عادية وأخفِ النص المشفر داخلها. الصورة ستبدو طبيعية تماماً للعين المجردة.",
    tip: " استخدم صور PNG للحصول على أفضل النتائج وتجنب فقدان البيانات.",
    example: {
      input: "صورة عادية + نص مشفر",
      output: "صورة تبدو طبيعية تحتوي النص المخفي",
    },
  },
  {
    number: "٣",
    icon: Unlock,
    title: "فك التشفير واستخراج النص",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    description: "ارفع الصورة المعدّلة وأدخل المفتاح السري. سيستخرج النظام النص المخفي ويفك تشفيره تلقائياً.",
    tip: " يجب استخدام نفس المفتاح المستخدم في التشفير.",
    example: {
      input: "الصورة + المفتاح السري",
      output: "مرحباً، هذه رسالة سرية!",
    },
  },
];

// ── أداة مقارنة النص ────────────────────────────────────────
const examples = [
  { plain: "مرحباً بك في CryptoGuard", encrypted: "U2FsdGVkX1+mK9pL3xR7nQ2vBhY8..." },
  { plain: "هذا نص سري جداً لا يجب أن يراه أحد", encrypted: "U2FsdGVkX1+9Xk2mNpQrStUvWxYz..." },
  { plain: "كلمة السر: CG@2024#Secure", encrypted: "U2FsdGVkX1+aAbBcCdDeEfFgGhH..." },
];

const CompareBox = () => {
  const [activeExample, setActiveExample] = useState(0);
  const [showEncrypted, setShowEncrypted] = useState(false);

  const handleNext = () => {
    setActiveExample((prev) => (prev + 1) % examples.length);
    setShowEncrypted(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-surface glow-border rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">جرب بنفسك — مقارنة النص</h3>
        </div>
        <button
          onClick={handleNext}
          className="text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10 border border-border"
        >
          مثال آخر ←
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* النص الأصلي */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">النص الأصلي</label>
          <div className="bg-secondary/50 border border-border rounded-xl p-4 min-h-[80px] flex items-center">
            <p className="text-foreground font-medium text-sm leading-relaxed">
              {examples[activeExample].plain}
            </p>
          </div>
        </div>

        {/* النص المشفر */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-primary uppercase tracking-wider">بعد التشفير</label>
          <div
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 min-h-[80px] flex items-center cursor-pointer hover:bg-primary/10 transition-all relative overflow-hidden"
            onClick={() => setShowEncrypted(!showEncrypted)}
          >
            <AnimatePresence mode="wait">
              {showEncrypted ? (
                <motion.p
                  key="encrypted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-primary text-xs font-mono break-all leading-relaxed"
                  dir="ltr"
                >
                  {examples[activeExample].encrypted}
                </motion.p>
              ) : (
                <motion.p
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground text-sm"
                >
                  اضغط لرؤية النص المشفر 
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        النص المشفر لا يمكن قراءته بدون المفتاح السري
      </p>
    </motion.div>
  );
};

// ── مكوّن سؤال شائع ─────────────────────────────────────────
const FAQ = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-secondary/50 transition-all"
      >
        <span className="font-bold text-foreground text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <p className="px-5 py-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── الصفحة الرئيسية ─────────────────────────────────────────
const HowToUse = () => {
  const navigate = useNavigate();

  return (
    <div className="gradient-mesh relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container max-w-3xl mx-auto px-4 py-10 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground glow-text">كيفية الاستخدام</h1>
              <p className="text-sm text-muted-foreground">دليل شامل لاستخدام CryptoGuard</p>
            </div>
          </div>
      
        </motion.div>

        {/* مقدمة */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-surface glow-border rounded-2xl p-6 mb-8 text-center"
        >
          <p className="text-foreground font-bold text-lg mb-2">كيف يعمل CryptoGuard؟</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            يجمع CryptoGuard بين تقنيتين: <span className="text-primary font-bold">التشفير AES-256</span> لتحويل النص إلى رموز،
            و<span className="text-primary font-bold">إخفاء المعلومات Steganography</span> لإخفاء تلك الرموز داخل صورة عادية.
            النتيجة: حماية مزدوجة لا يمكن اختراقها بدون المفتاح.
          </p>
        </motion.div>

        {/* خطوات الاستخدام */}
        <p className="text-sm font-bold text-muted-foreground mb-4">خطوات الاستخدام</p>
        <div className="space-y-4 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className={`glass-surface rounded-2xl p-6 border ${step.border} space-y-3`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${step.color}`}>{step.number}</span>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {/* مثال */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">المدخل</p>
                    <p className="text-xs text-foreground font-medium">{step.example.input}</p>
                  </div>
                  <div className={`${step.bg} rounded-xl p-3 border ${step.border}`}>
                    <p className={`text-xs ${step.color} mb-1`}>المخرج</p>
                    <p className="text-xs text-foreground font-medium">{step.example.output}</p>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl px-4 py-3 border border-border">
                  <p className="text-xs text-muted-foreground">{step.tip}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* مقارنة النص */}
        <p className="text-sm font-bold text-muted-foreground mb-4">مقارنة النص قبل وبعد التشفير</p>
        <div className="mb-8">
          <CompareBox />
        </div>

        {/* الأسئلة الشائعة */}
        <p className="text-sm font-bold text-muted-foreground mb-4"> أسئلة شائعة</p>
        <div className="space-y-3 mb-8">
          <FAQ
            q="ما الفرق بين التشفير وإخفاء في الصورة؟"
            a="التشفير يحول النص إلى رموز غير مفهومة، أما إخفاء في الصورة (Steganography) فيخفي هذه الرموز داخل صورة بحيث لا يعلم أحد أن الصورة تحتوي على بيانات مخفية."
          />
          <FAQ
            q="هل يمكن لأحد فك التشفير بدون المفتاح؟"
            a="لا. خوارزمية AES-256 من أقوى خوارزميات التشفير في العالم. بدون المفتاح السري، يستحيل عملياً فك التشفير."
          />
          <FAQ
            q="ما نوع الصور المدعومة؟"
            a="الصور المدعومة: PNG وWEBPو JPG. "
          />
          <FAQ
            q="ماذا يحدث إذا انتهت صلاحية الرسالة؟"
            a="إذا حددت وقت انتهاء للرسالة، فعند محاولة استخراجها بعد ذلك الوقت ستظهر رسالة 'انتهت صلاحية هذه الرسالة' ولن يتمكن أحد من قراءتها."
          />
        </div>

        {/* أزرار البدء */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={() => navigate("/encrypt")}
            className="glass-surface glow-border rounded-2xl p-5 flex items-center justify-center gap-3 hover:border-primary/50 transition-all group bg-primary/5"
          >
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">ابدأ التشفير</span>
            <ArrowLeft className="w-4 h-4 text-primary/50 group-hover:text-primary transition-all" />
          </button>
          <button
            onClick={() => navigate("/decode")}
            className="glass-surface glow-border rounded-2xl p-5 flex items-center justify-center gap-3 hover:border-primary/50 transition-all group"
          >
            <Unlock className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">فك التشفير</span>
            <ArrowLeft className="w-4 h-4 text-primary/50 group-hover:text-primary transition-all" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default HowToUse;
