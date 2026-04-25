import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, ArrowLeft, ChevronDown, Sparkles, Key, Hash, Clock } from "lucide-react";
import { useRef, useState } from "react";

// بطاقة قابلة للقلب
const FlipCard = ({ member, delay, isLast }: { member: { name: string; letter: string }; delay: number; isLast?: boolean }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`${isLast ? "md:col-start-2" : ""}`}
      style={{ perspective: "1000px" }}
    >
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative w-full cursor-pointer"
        style={{
          height: "160px",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* الوجه الأمامي — الحرف */}
        <div
          className="absolute inset-0 glass-surface glow-border rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <span className="text-3xl font-black text-primary">{member.letter}</span>
          </div>
          <p className="text-xs text-muted-foreground">اضغط لمعرفة الاسم</p>
        </div>

        {/* الوجه الخلفي — الاسم */}
        <div
          className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-2 px-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Shield className="w-6 h-6 text-primary" />
          <p className="text-sm font-black text-foreground text-center leading-relaxed">{member.name}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const features = [
    {
      icon: Lock,
      title: "تشفير AES-256",
      desc: "خوارزمية تشفير قوية تحول نصك لرموز لا يمكن قراءتها بدون المفتاح",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      icon: Eye,
      title: "إخفاء في الصور",
      desc: "تقنية LSB with PRNG تخفي رسالتك داخل صورة عادية — غير مرئي للعين",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
    {
      icon: Clock,
      title: "انتهاء الصلاحية",
      desc: "حدد وقتاً تنتهي فيه الرسالة تلقائياً — لا أحد يقرأها بعده",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      icon: Hash,
      title: "التحقق من البصمة",
      desc: "SHA-256 يكشف أي تعديل على الصورة فوراً — حماية من التلاعب",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
    },
  ];

  const steps = [
    { num: "١", title: "اكتب رسالتك", desc: "أدخل النص بالعربي أو الإنجليزي واختر مفتاحاً سرياً", icon: Lock },
    { num: "٢", title: "شفّر وأخفِ", desc: "النظام يشفر النص بـ AES ويخفيه داخل صورة", icon: Eye },
    { num: "٣", title: "أرسل بأمان", desc: "أرسل الصورة — تبدو عادية لكنها تحمل رسالتك المشفرة", icon: Shield },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* خلفية متحركة */}
        <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        </motion.div>

        {/* شبكة خلفية */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(hsl(174 80% 52% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(174 80% 52% / 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />

        <div className="container max-w-5xl mx-auto px-4 text-center relative z-10">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-bold">تشفير وإخفاء رسائلك بأمان</span>
          </motion.div>

          {/* العنوان */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <h1 className="text-6xl md:text-8xl font-black text-foreground mb-6 leading-tight">
              <span className="glow-text text-primary">Crypto</span>
              <span className="text-foreground">Guard</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              حماية رسائلك بطبقتين أمان —
            </p>
            <p className="text-lg text-primary font-bold mb-12">
              تشفير AES-256 + إخفاء في الصور بتقنية LSB
            </p>
          </motion.div>

          {/* أزرار */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-3 bg-primary text-primary-foreground font-black px-8 py-4 rounded-2xl hover:opacity-90 transition-all glow-box text-lg"
            >
              ابدأ الآن
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-3 glass-surface glow-border text-foreground font-bold px-8 py-4 rounded-2xl hover:border-primary/50 transition-all text-lg"
            >
              اكتشف المميزات
              <ChevronDown className="w-5 h-5" />
            </button>
          </motion.div>

          {/* إحصائيات */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-16 flex-wrap"
          >
            {[
              { value: "LSB+PRNG", label: "إخفاء متطور" },
              { value: "100%", label: "دعم العربية" },
              { value: "SHA-256", label: "تحقق من السلامة" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl font-black text-primary glow-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* سهم للأسفل */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16"
          >
            <ChevronDown className="w-6 h-6 text-primary/40 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background pointer-events-none" />

        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary font-bold text-sm mb-3 tracking-widest uppercase">المميزات</p>
            <h2 className="text-4xl font-black text-foreground">حماية متعددة الطبقات</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              كل طبقة تضيف مستوى أمان إضافي — معاً يجعلون رسالتك محمية بشكل كامل
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`glass-surface rounded-2xl p-6 border ${f.border} space-y-4 cursor-default`}
                >
                  <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 relative">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary font-bold text-sm mb-3 tracking-widest uppercase">كيف يعمل</p>
            <h2 className="text-4xl font-black text-foreground">ثلاث خطوات بسيطة</h2>
          </motion.div>

          <div className="relative">
            {/* خط رابط */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="text-center space-y-4"
                  >
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                        {s.num}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team Section ── */}
      <section className="py-24 relative">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary font-bold text-sm mb-3 tracking-widest uppercase">الفريق</p>
            <h2 className="text-4xl font-black text-foreground">فريق المشروع</h2>
            <p className="text-muted-foreground mt-4">انقر على البطاقة للتعرف على أعضاء الفريق 👆</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { name: "لينا محمد القرني", letter: "ل" },
              { name: "ضي عبدالله القرني", letter: "ض" },
              { name: "دانه محمد عبدالله الاسمري", letter: "د" },
              { name: "اريام يحيى العمري", letter: "أ" },
              { name: "ساره عبدالرحمن العمري", letter:"س" },
            ].map((member, i) => (
              <FlipCard key={i} member={member} delay={i * 0.1} isLast={i === 4} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container max-w-2xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-surface glow-border rounded-3xl p-12 space-y-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground">جاهز لتأمين رسائلك؟</h2>
            <p className="text-muted-foreground">
              ابدأ الآن وشفّر رسالتك بأقوى تقنيات الحماية المتاحة
            </p>
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-3 bg-primary text-primary-foreground font-black px-10 py-4 rounded-2xl hover:opacity-90 transition-all glow-box text-lg mx-auto"
            >
              ابدأ الآن مجاناً
              <ArrowLeft className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
