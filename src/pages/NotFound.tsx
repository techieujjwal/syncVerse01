import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1)_0%,rgba(0,0,0,0)_60%)]" />
      <div className="absolute inset-0 stars" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[8rem] md:text-[10rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5"
        >
          404
        </motion.div>

        <h2 className="text-xl font-semibold text-white/70 -mt-4 mb-3">Page not found</h2>
        <p className="text-sm text-white/30 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/">
          <Button className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all">
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
