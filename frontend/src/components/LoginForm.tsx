import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, User, Unlock, ArrowLeft, UserPlus, BarChart3, Shield } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useNavigate } from "react-router-dom";

// قوة كلمة السر
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  if (password.length === 0) return { strength: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { strength: 1, label: "ضعيفة", color: "bg-red-500" };
  if (score === 2) return { strength: 2, label: "متوسطة", color: "bg-yellow-500" };
  if (score === 3) return { strength: 3, label: "جيدة", color: "bg-blue-400" };
  return { strength: 4, label: "قوية", color: "bg-green-500" };
};

const LoginForm = () => {
  const { login, register, isLoggedIn, username: storedUsername } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState(storedUsername || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("⚠️ يرجى ملء جميع الحقول");
      return;
    }
    const result = await login(username, password);
    if (!result.success) {
      setError("⚠️ " + result.error);
      return;
    }
    setError("");
    setLoggedIn(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("⚠️ يرجى ملء جميع الحقول");
      return;
    }
    if (password.length < 4) {
      setError("⚠️ كلمة السر يجب أن تكون 4 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      setError("⚠️ كلمتا السر غير متطابقتين");
      return;
    }
    const result = await register(username, password);
    if (!result.success) {
      setError("⚠️ " + result.error);
      return;
    }
    setError("");
    setLoggedIn(true);
  };

  const goTo = (destination: string) => navigate(destination);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-surface glow-border rounded-2xl p-8">
        <AnimatePresence mode="wait">

          {!loggedIn && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex rounded-xl overflow-hidden border border-border mb-6">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-bold transition-all ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-bold transition-all ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  إنشاء حساب
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 mb-6">
                {mode === "login"
                  ? <Lock className="w-6 h-6 text-primary" />
                  : <UserPlus className="w-6 h-6 text-primary" />
                }
                <h2 className="text-2xl font-bold text-foreground">
                  {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
                </h2>
              </div>

              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">اسم المستخدم</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pr-11 pl-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      placeholder="أدخل اسم المستخدم"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">كلمة السر</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pr-11 pl-11 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      placeholder="أدخل كلمة السر"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* مؤشر قوة كلمة السر - يظهر فقط عند التسجيل */}
                  {mode === "register" && password.length > 0 && (() => {
                    const { strength, label, color } = getPasswordStrength(password);
                    return (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? color : "bg-secondary border border-border"}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${strength <= 1 ? "text-red-400" : strength === 2 ? "text-yellow-400" : strength === 3 ? "text-blue-400" : "text-green-400"}`}>
                          قوة كلمة السر: {label}
                        </p>
                      </motion.div>
                    );
                  })()}
                </div>

                {mode === "register" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">تأكيد كلمة السر</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl pr-11 pl-11 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        placeholder="أعد إدخال كلمة السر"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3"
                  >
                    <p className="text-destructive text-sm text-center">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all glow-box"
                >
                  {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
                </button>
              </form>
            </motion.div>
          )}

          {loggedIn && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="text-center">
                <p className="text-primary font-bold text-lg">أهلاً، {username}! 👋</p>
                <p className="text-muted-foreground text-sm mt-1">ما دورك؟</p>
              </div>

              <div className="h-px bg-border" />

              {/* اختيار الدور */}
              <div className="grid grid-cols-2 gap-3">
                {/* المُرسِل */}
                <button
                  onClick={() => goTo("/encrypt")}
                  className="flex flex-col items-center gap-3 w-full bg-primary/10 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/15 text-foreground font-bold py-6 px-4 rounded-2xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-foreground text-base">📤 مُرسِل</p>
                    <p className="text-xs text-muted-foreground font-normal mt-1">أريد تشفير رسالة وإخفاءها</p>
                  </div>
                </button>

                {/* المُستلم */}
                <button
                  onClick={() => goTo("/decode")}
                  className="flex flex-col items-center gap-3 w-full bg-secondary border-2 border-border hover:border-primary/40 hover:bg-secondary/80 text-foreground font-bold py-6 px-4 rounded-2xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center group-hover:border-primary/40 transition-all">
                    <Unlock className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-all" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-foreground text-base">📥 مُستلم</p>
                    <p className="text-xs text-muted-foreground font-normal mt-1">أريد قراءة رسالة وصلتني</p>
                  </div>
                </button>
              </div>

              <div className="h-px bg-border" />

              {/* روابط إضافية */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => goTo("/dashboard")}
                  className="flex items-center gap-3 w-full bg-secondary/50 border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground py-3 px-4 rounded-xl transition-all text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 mr-auto" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LoginForm;
