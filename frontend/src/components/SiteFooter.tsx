import { motion } from "framer-motion";
import { Shield, Lock, Eye, KeyRound, Heart } from "lucide-react";

const items = [
  { icon: Lock, label: "تشفير AES-256" },
  { icon: Eye, label: "إخفاء داخل الصور" },
  { icon: KeyRound, label: "حماية بالمفتاح السري" },
];

const SiteFooter = () => {
  return (
    <footer id="site-footer" className="relative z-10 mt-6 border-t border-primary/10 md:mt-8">
      <div className="w-full px-4 pb-8 pt-6 md:px-6">
        <div className="glass-surface w-full rounded-3xl px-6 py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">CryptoGuard</p>
                  <p className="text-xs text-muted-foreground">منصة عربية لحماية الرسائل الحساسة</p>
                </div>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                يجمع الموقع بين التشفير والإخفاء داخل الصور لتوفير طبقتين من الحماية بدون تعقيد في الاستخدام.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {items.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2026 CryptoGuard. جميع الحقوق محفوظة.</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>مطور بـ</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>للحماية والأمان</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>آمن 100%</span>
              <span>•</span>
              <span>مشفر بالكامل</span>
              <span>•</span>
              <span>خصوصية مضمونة</span>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
