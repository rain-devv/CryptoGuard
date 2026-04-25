import { motion } from "framer-motion";
import {
  Shield, LogOut, Lock, Eye, EyeOff, Unlock, BarChart3,
  Clock, CheckCircle, XCircle, Home, Activity,
  TrendingUp, User, Gauge, ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const StatCard = ({
  icon: Icon, label, value, color = "text-primary", delay = 0, sub,
}: {
  icon: typeof Shield; label: string; value: number | string;
  color?: string; delay?: number; sub?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-surface glow-border rounded-2xl p-5 flex flex-col gap-3"
  >
    <div className={`w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-3xl font-black text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className={`text-xs font-bold mt-1 ${color}`}>{sub}</p>}
    </div>
  </motion.div>
);

const typeConfig: Record<string, { label: string; icon: typeof Lock; color: string }> = {
  encrypt:       { label: "تشفير نص",        icon: Lock,   color: "text-primary" },
  decrypt:       { label: "فك تشفير",        icon: Unlock, color: "text-blue-400" },
  steganography: { label: "إخفاء في صورة",   icon: EyeOff, color: "text-purple-400" },
  extract:       { label: "استخراج من صورة", icon: Eye,    color: "text-orange-400" },
};

const formatTime = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleString("ar-SA", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// رسم بياني بسيط للعمليات آخر 7 أيام
const WeeklyChart = ({ operations }: { operations: any[] }) => {
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("ar-SA", { weekday: "short" });
      const count = operations.filter((op) => {
        const opDate = new Date(op.timestamp);
        return opDate.toDateString() === d.toDateString();
      }).length;
      result.push({ label, count });
    }
    return result;
  }, [operations]);

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> العمليات خلال آخر 7 أيام
      </p>
      <div className="flex items-end gap-2 h-28">
        {days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(day.count / maxCount) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="w-full rounded-t-lg bg-primary/60 hover:bg-primary transition-all min-h-[4px]"
              style={{ height: day.count === 0 ? "4px" : undefined }}
            />
            <p className="text-xs text-muted-foreground">{day.label}</p>
            <p className="text-xs font-bold text-primary">{day.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { username, logout, operations } = useAuth();
  const navigate = useNavigate();

  const encryptCount      = operations.filter((o) => o.type === "encrypt").length;
  const decryptCount      = operations.filter((o) => o.type === "decrypt").length;
  const steganographyCount = operations.filter((o) => o.type === "steganography").length;
  const extractCount      = operations.filter((o) => o.type === "extract").length;
  const successCount      = operations.filter((o) => o.success).length;
  const failCount         = operations.filter((o) => !o.success).length;
  const totalCount        = operations.length;
  const successRate       = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div className="gradient-mesh relative overflow-hidden min-h-screen">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground glow-text">لوحة التحكم</h1>
            </div>
          </div>
        </motion.div>

        {/* بطاقة المستخدم */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-surface glow-border rounded-2xl p-6 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{username}</p>
            <p className="text-sm text-muted-foreground">
              إجمالي العمليات: <span className="text-primary font-bold">{totalCount}</span> عملية
            </p>
          </div>
          <div className="mr-auto text-left">
            <div className="flex items-center gap-1">
              <Gauge className="w-5 h-5 text-primary" />
              <p className="text-3xl font-black text-primary">{successRate}%</p>
            </div>
            <p className="text-xs text-muted-foreground">نسبة النجاح</p>
          </div>
        </motion.div>

        {/* إحصائيات العمليات */}
        <p className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> إحصائيات العمليات
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard icon={Lock}    label="تشفير نص"        value={encryptCount}       delay={0.1} />
          <StatCard icon={Unlock}  label="فك تشفير"        value={decryptCount}       delay={0.15} color="text-blue-400" />
          <StatCard icon={EyeOff}  label="إخفاء في صورة"  value={steganographyCount} delay={0.2}  color="text-purple-400" />
          <StatCard icon={Eye}     label="استخراج"         value={extractCount}       delay={0.25} color="text-orange-400" />
        </div>

        {/* إحصائيات النجاح والفشل */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={TrendingUp}  label="إجمالي العمليات" value={totalCount}   delay={0.3} />
          <StatCard icon={Gauge}       label="ناجحة"            value={successCount} color="text-green-400" delay={0.35}
            sub={totalCount > 0 ? `${Math.round((successCount/totalCount)*100)}%` : "0%"} />
          <StatCard icon={Gauge}       label="فاشلة"            value={failCount}    color="text-destructive" delay={0.4}
            sub={totalCount > 0 ? `${Math.round((failCount/totalCount)*100)}%` : "0%"} />
        </div>

        {/* الرسم البياني */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="glass-surface glow-border rounded-2xl p-6 mb-6">
          <WeeklyChart operations={operations} />
        </motion.div>

        {/* سجل العمليات */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-surface glow-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">سجل العمليات السابقة</h2>
            <span className="mr-auto text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border">
              {totalCount} عملية
            </span>
          </div>

          {operations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">لا توجد عمليات بعد</p>
              <p className="text-muted-foreground/60 text-xs mt-1">ابدأ بتشفير نص أو إخفائه في صورة</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {operations.map((op, idx) => {
                const config = typeConfig[op.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{config.label}</p>
                    </div>
                    <div className="text-left flex-shrink-0 space-y-1">
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${op.success ? "bg-green-400/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                        {op.success
                          ? <><CheckCircle className="w-3 h-3" /> نشطة</>
                          : <><XCircle className="w-3 h-3" /> فاشلة</>
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTime(op.timestamp)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* أزرار الإجراءات السريعة */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mt-6">
          <button onClick={() => navigate("/encrypt")}
            className="bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 hover:border-primary/70 rounded-2xl p-5 flex items-center gap-3 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center group-hover:bg-primary/40 transition-all">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground text-sm">تشفير نص</p>
              <p className="text-xs text-muted-foreground">ابدأ عملية تشفير جديدة</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-primary/60 mr-auto" />
          </button>
          <button onClick={() => navigate("/decode")}
            className="bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 hover:border-primary/70 rounded-2xl p-5 flex items-center gap-3 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center group-hover:bg-primary/40 transition-all">
              <Unlock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground text-sm">فك التشفير</p>
              <p className="text-xs text-muted-foreground">استخراج نص مخفي</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-primary/60 mr-auto" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
