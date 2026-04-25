import { motion } from "framer-motion";
import { ChevronLeft, Eye, Lock, Shield, Sparkles } from "lucide-react";
import LoginForm from "@/components/LoginForm";

const encryptionIllustration = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="180" rx="28" fill="#22326F"/>
    <rect x="22" y="30" width="136" height="120" rx="22" fill="#F8CDDA" fill-opacity="0.16" stroke="#F8CDDA" stroke-opacity="0.38"/>
    <rect x="40" y="52" width="100" height="14" rx="7" fill="#F8CDDA" fill-opacity="0.9"/>
    <rect x="40" y="78" width="80" height="10" rx="5" fill="#F8CDDA" fill-opacity="0.42"/>
    <rect x="40" y="96" width="92" height="10" rx="5" fill="#F8CDDA" fill-opacity="0.28"/>
    <rect x="182" y="42" width="104" height="96" rx="24" fill="#182554" stroke="#F8CDDA" stroke-opacity="0.34"/>
    <path d="M212 77C212 62.6406 223.641 51 238 51C252.359 51 264 62.6406 264 77V87H212V77Z" fill="#F8CDDA" fill-opacity="0.9"/>
    <rect x="204" y="84" width="68" height="48" rx="14" fill="#F8CDDA"/>
    <circle cx="238" cy="104" r="9" fill="#22326F"/>
    <rect x="234" y="110" width="8" height="12" rx="4" fill="#22326F"/>
    <path d="M156 93H186" stroke="#F8CDDA" stroke-width="6" stroke-linecap="round"/>
    <path d="M165 84L186 93L165 102" stroke="#F8CDDA" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`)}`;

const steganographyIllustration = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="180" rx="28" fill="#22326F"/>
    <rect x="28" y="28" width="160" height="124" rx="24" fill="#F8CDDA" fill-opacity="0.12" stroke="#F8CDDA" stroke-opacity="0.34"/>
    <rect x="44" y="44" width="128" height="92" rx="18" fill="#F8CDDA" fill-opacity="0.92"/>
    <path d="M58 116L88 84L110 104L134 74L158 116H58Z" fill="#22326F" fill-opacity="0.86"/>
    <circle cx="134" cy="68" r="10" fill="#22326F"/>
    <rect x="206" y="40" width="86" height="108" rx="22" fill="#182554" stroke="#F8CDDA" stroke-opacity="0.3"/>
    <rect x="223" y="60" width="52" height="10" rx="5" fill="#F8CDDA" fill-opacity="0.92"/>
    <rect x="223" y="80" width="38" height="8" rx="4" fill="#F8CDDA" fill-opacity="0.46"/>
    <rect x="223" y="96" width="46" height="8" rx="4" fill="#F8CDDA" fill-opacity="0.3"/>
    <circle cx="216" cy="112" r="4" fill="#F8CDDA"/>
    <circle cx="228" cy="112" r="4" fill="#F8CDDA" fill-opacity="0.7"/>
    <circle cx="240" cy="112" r="4" fill="#F8CDDA" fill-opacity="0.45"/>
    <path d="M174 90H206" stroke="#F8CDDA" stroke-width="6" stroke-linecap="round"/>
    <path d="M197 81L206 90L197 99" stroke="#F8CDDA" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`)}`;

const FeatureCard = ({
  imageSrc,
  title,
  description,
  badge,
  icon: Icon,
  delay,
}: {
  imageSrc: string;
  title: string;
  description: string;
  badge: string;
  icon: typeof Lock;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{
      y: -10,
      scale: 1.03,
      rotateX: 4,
      rotateY: -4,
      boxShadow: "0 28px 60px rgba(248,205,218,0.18)",
    }}
    className="group glass-surface glow-border relative overflow-hidden rounded-[28px] p-0 cursor-default transition-all duration-300"
    style={{ transformStyle: "preserve-3d" }}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(248,205,218,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_28%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

    <motion.div
      className="relative m-3 overflow-hidden rounded-[22px] border border-primary/20 bg-primary/5 p-2"
      whileHover={{ borderColor: "rgba(248,205,218,0.45)" }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#16224b]/80 px-3 py-1 text-xs font-bold text-primary backdrop-blur-md">
        <Icon className="h-3.5 w-3.5" />
        {badge}
      </div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        whileHover={{ opacity: 1 }}
      />
      <motion.img
        src={imageSrc}
        alt={title}
        className="h-40 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </motion.div>

    <div className="relative z-10 flex flex-col gap-4 px-6 pb-6 pt-2 text-right">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/15">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-bold tracking-[0.18em] text-primary/70">
            SECURE LAYER
          </p>
          <motion.h3
            className="text-lg font-black text-foreground transition-colors duration-300 group-hover:text-primary"
            whileHover={{ y: -2 }}
          >
            {title}
          </motion.h3>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary/85 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">مرر لعرض التفاصيل</span>
        </div>
        <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
      </div>

      <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-300 group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-primary/20 bg-background/30 px-4 py-4 backdrop-blur-sm">
            <motion.p
              className="text-sm leading-7 text-foreground/85"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ y: -1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {description}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const Index = () => {
  return (
    <div className="gradient-mesh relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />


      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-black text-foreground glow-text">
              CryptoGuard
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-bold text-lg md:text-xl mt-4 glow-text"
          >
            نحن الموقع الوحيد الذي يدعم اللغة العربية والتشفير بهذه الخاصية
          </motion.p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid gap-6 mb-10 md:grid-cols-2 md:mb-12">
          <FeatureCard
            imageSrc={encryptionIllustration}
            title="التشفير (Encryption)"
            description="تحويل النصوص إلى صيغة مشفرة غير مقروءة باستخدام خوارزمية AES المتقدمة. لا يمكن فك التشفير إلا بمعرفة المفتاح السري."
            badge="AES-256"
            icon={Lock}
            delay={0.1}
          />
          <FeatureCard
            imageSrc={steganographyIllustration}
            title="الإخفاء (Steganography)"
            description="إخفاء البيانات والنصوص المشفرة داخل الصور بشكل غير مرئي للعين المجردة. طبقة حماية إضافية فوق التشفير."
            badge="Steganography"
            icon={Eye}
            delay={0.2}
          />
        </div>

        {/* Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-8 md:mb-10"
        >
          <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
          <p className="text-muted-foreground text-sm">
            حماية مزدوجة: تشفير + إخفاء داخل الصور
          </p>
          <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
        </motion.div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
};

export default Index;
