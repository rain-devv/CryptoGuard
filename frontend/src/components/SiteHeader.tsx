import { AnimatePresence, motion } from "framer-motion";
import { Shield, LogOut, LayoutDashboard, Lock, Eye, Unlock, BookOpen, Home, Info } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { to: "/home", label: "الرئيسية", icon: Home, public: true },
  { to: "/how-to-use", label: "كيفية الاستخدام", icon: BookOpen, public: true },
  { to: "/encrypt", label: "التشفير", icon: Lock, public: false },
  { to: "/steganography", label: "الإخفاء", icon: Eye, public: false },
  { to: "/decode", label: "فك الإخفاء", icon: Unlock, public: false },
];

const navItemClass =
  "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/20 hover:text-foreground";

const AboutModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.94, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.94, opacity: 0 }}
      className="glass-surface glow-border w-full max-w-md rounded-2xl p-8 text-right"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="mb-4 text-2xl font-black text-primary">عن CryptoGuard</h2>
      <p className="mb-4 text-sm leading-loose text-muted-foreground">
        CryptoGuard هو الموقع الأول والوحيد الذي يدعم اللغة العربية بالكامل في مجال التشفير وإخفاء المعلومات داخل الصور.
      </p>
      <p className="mb-6 text-sm leading-loose text-muted-foreground">
        يستخدم الموقع خوارزمية AES-256 للتشفير وتقنية Steganography لإخفاء النصوص داخل الصور، مما يوفر حماية مزدوجة لمعلوماتك.
      </p>
      <button
        onClick={onClose}
        className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-all hover:opacity-90"
      >
        إغلاق
      </button>
    </motion.div>
  </motion.div>
);

const SiteHeader = () => {
  const navigate = useNavigate();
  const { isLoggedIn, username, logout } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

  const visibleLinks = links.filter((link) => link.public || isLoggedIn);
  const homeLink = visibleLinks.find((link) => link.to === "/home");
  const primaryLinks = visibleLinks.filter((link) =>
    ["/encrypt", "/steganography", "/decode"].includes(link.to)
  );
  const helpLink = visibleLinks.find((link) => link.to === "/how-to-use");

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-primary/10 bg-background/75 backdrop-blur-xl"
      >
        <div className="w-full px-4 md:px-6">
          <div className="glass-surface my-4 flex w-full flex-col gap-4 rounded-2xl px-4 py-4 md:flex-row md:items-center md:justify-between">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-3 text-right"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground">CryptoGuard</p>
                <p className="text-xs text-muted-foreground">التشفير والإخفاء بالعربية</p>
              </div>
            </button>

            <nav className="flex flex-wrap items-center gap-2">
              {homeLink && (
                <NavLink
                  to={homeLink.to}
                  className={({ isActive }: { isActive?: boolean }) =>
                    cn(
                      navItemClass,
                      isActive && "border-primary/35 bg-primary/15 text-primary"
                    )
                  }
                >
                  <homeLink.icon className="h-4 w-4" />
                  {homeLink.label}
                </NavLink>
              )}
              {primaryLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }: { isActive?: boolean }) =>
                    cn(
                      navItemClass,
                      isActive && "border-primary/35 bg-primary/15 text-primary"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className={navItemClass}
              >
                <Info className="h-4 w-4" />
                عن الموقع
              </button>
              {helpLink && (
                <NavLink
                  to={helpLink.to}
                  className={({ isActive }: { isActive?: boolean }) =>
                    cn(
                      navItemClass,
                      isActive && "border-primary/35 bg-primary/15 text-primary"
                    )
                  }
                >
                  <helpLink.icon className="h-4 w-4" />
                  {helpLink.label}
                </NavLink>
              )}
            </nav>

            <div className="flex items-center justify-between gap-3 md:min-w-[180px] md:justify-end">
              {isLoggedIn ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{username}</p>
                    <p className="text-xs text-muted-foreground">جلسة نشطة</p>
                  </div>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }: { isActive?: boolean }) =>
                      cn(
                        navItemClass,
                        isActive && "border-primary/35 bg-primary/15 text-primary"
                      )
                    }
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/home");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive transition-all hover:bg-destructive/15"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">زائر</p>
                  <p className="text-xs text-muted-foreground">سجّل الدخول للمتابعة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </AnimatePresence>
    </>
  );
};

export default SiteHeader;
