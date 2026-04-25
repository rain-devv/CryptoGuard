import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="gradient-mesh flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center glass-surface glow-border rounded-2xl p-12 max-w-md w-full"
      >
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-primary/40" />
        </div>
        <h1 className="text-7xl font-black text-primary glow-text mb-4">404</h1>
        <p className="text-xl font-bold text-foreground mb-2">الصفحة غير موجودة</p>
        <p className="text-muted-foreground text-sm mb-8">الرابط الذي تبحثين عنه غير متاح</p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all glow-box flex items-center gap-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
