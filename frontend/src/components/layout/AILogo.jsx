import { motion } from "framer-motion";

const AILogo = ({ isInteractive = true }) => {
  return (
    <div
      className="relative h-11 w-11 flex items-center justify-center cursor-pointer select-none"
      aria-label="HireSense AI Core"
    >
      {/* Soft outer halo glow — breathes ambiently and blooms on hover */}
      <motion.div
        className="absolute -inset-1 rounded-[20px] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          filter: "blur(9px)",
        }}
        animate={{
          opacity: [0.45, 0.85, 0.45],
          scale: [0.88, 1.08, 0.88],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating conic gradient ring (accelerates on hover) */}
      <div className="absolute inset-0 rounded-[15px] overflow-hidden">
        <motion.div
          className="absolute -inset-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, #1d402b, #3d6e50, #86efac, #3d6e50, #1d402b)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Inner card frame */}
      <div className="relative h-[34px] w-[34px] rounded-[11px] bg-[var(--surface)] flex items-center justify-center overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors">
        {/* Soft inner gradient backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--accent-soft) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shimmering core diamond */}
        <motion.div
          className="relative h-[15px] w-[15px] rounded-[3px] flex items-center justify-center shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, #4ade80 0%, #15803d 50%, #166534 100%)",
            backgroundSize: "200% 200%",
            rotate: 45,
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            scale: [1, 1.14, 1],
            rotate: [45, 55, 45],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner Core Monogram "AI" or spark */}
          <span
            className="text-[8px] font-black tracking-tighter text-white select-none -rotate-45 leading-none"
            style={{ textShadow: "0 0 3px rgba(0,0,0,0.8)" }}
          >
            AI
          </span>
        </motion.div>

        {/* Floating highlight sparkles */}
        <motion.div
          className="absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{ boxShadow: "0 0 5px rgba(255,255,255,0.95)" }}
          animate={{
            opacity: [0, 1, 0],
            top: ["25%", "40%", "65%"],
            left: ["35%", "60%", "40%"],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute h-[2px] w-[2px] rounded-full bg-white"
          style={{ boxShadow: "0 0 3px rgba(255,255,255,0.85)" }}
          animate={{
            opacity: [0, 1, 0],
            top: ["60%", "30%", "60%"],
            left: ["65%", "35%", "25%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
    </div>
  );
};

export default AILogo;
