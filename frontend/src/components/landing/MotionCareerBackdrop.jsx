import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  FileText,
  Laptop,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

const particles = [
  { left: "12%", top: "26%", delay: 0, duration: 7 },
  { left: "29%", top: "66%", delay: 1.8, duration: 8 },
  { left: "56%", top: "18%", delay: 2.4, duration: 9 },
  { left: "76%", top: "64%", delay: 0.8, duration: 7.5 },
  { left: "89%", top: "32%", delay: 3, duration: 8.5 },
];

function FloatingCard({ className, children, delay = 0, duration = 7 }) {
  return (
    <motion.div
      className={`absolute pointer-events-none rounded-2xl border border-white/15 bg-white/[0.09] p-3 text-white/80 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
      animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCareerBackdrop() {
  const ref = useRef(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 80, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 80, damping: 20 });
  const foregroundX = useTransform(x, [-1, 1], [-14, 14]);
  const foregroundY = useTransform(y, [-1, 1], [-10, 10]);
  const backgroundX = useTransform(x, [-1, 1], [8, -8]);
  const backgroundY = useTransform(y, [-1, 1], [6, -6]);

  useEffect(() => {
    function handleWindowPointerMove(event) {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        pointerX.set(0);
        pointerY.set(0);
        return;
      }
      pointerX.set((event.clientX - bounds.left) / bounds.width * 2 - 1);
      pointerY.set((event.clientY - bounds.top) / bounds.height * 2 - 1);
    }

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleWindowPointerMove);
  }, [pointerX, pointerY]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <motion.div className="absolute inset-0" style={{ x: backgroundX, y: backgroundY }}>
        <div className="absolute -left-24 top-20 h-[480px] w-[480px] rounded-full bg-[#79a88d]/20 blur-[100px]" />
        <div className="absolute right-[-8%] top-[12%] h-[380px] w-[380px] rounded-full bg-[#9079e8]/20 blur-[110px]" />
        <div className="absolute bottom-[-20%] left-[28%] h-[420px] w-[620px] rounded-full bg-[#2b8770]/20 blur-[120px]" />
      </motion.div>

      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="none">
        <path className="career-path" d="M80 585C250 585 210 230 440 280S665 650 830 420 1010 170 1160 230" stroke="#B6CFC0" strokeWidth="1.2" strokeDasharray="5 13" />
        <path className="career-path career-path-delay" d="M-20 190C170 90 255 440 470 420S650 110 860 180 1040 550 1220 500" stroke="#A795FF" strokeWidth="1" strokeDasharray="3 15" />
        <circle cx="595" cy="370" r="72" stroke="#B6CFC0" strokeOpacity=".22" />
        <circle cx="595" cy="370" r="98" stroke="#A795FF" strokeOpacity=".14" strokeDasharray="2 12" />
      </svg>

      {particles.map((particle) => (
        <span
          key={`${particle.left}-${particle.top}`}
          className="career-particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      <motion.div className="absolute inset-0" style={{ x: foregroundX, y: foregroundY }}>
        <div className="absolute left-[8%] top-[16%] hidden lg:block">
          <FloatingCard className="w-44" delay={0.4}>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-white/50">
              <span>Resume scan</span><FileText size={13} className="text-[#B6CFC0]" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-28 rounded-full bg-white/40" />
              <div className="h-1.5 w-36 rounded-full bg-white/15" />
              <div className="relative h-1.5 w-24 rounded-full bg-white/15">
                <span className="scan-line" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#B6CFC0]"><Check size={12} /> 92 ATS compatibility</div>
          </FloatingCard>
        </div>

        <div className="absolute right-[8%] top-[20%] hidden lg:block">
          <FloatingCard className="w-48" delay={1.2} duration={8.5}>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#A795FF]/20 text-[#C2B8FF]"><Target size={14} /></span>
              <div><div className="text-xs font-semibold text-white">Role match found</div><div className="text-[10px] text-white/45">Product Engineer · 94%</div></div>
            </div>
            <div className="mt-3 flex gap-1.5"><span className="rounded-full bg-white/10 px-2 py-1 text-[9px]">Remote</span><span className="rounded-full bg-[#B6CFC0]/15 px-2 py-1 text-[9px] text-[#B6CFC0]">$128k–$154k</span></div>
          </FloatingCard>
        </div>

        <div className="absolute bottom-[16%] left-[13%] hidden lg:block">
          <FloatingCard className="w-48" delay={2.2} duration={9}>
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><Laptop size={14} /></span>Interview ready</div>
            <div className="mt-3 flex items-end gap-1 h-8">
              {[3, 5, 8, 4, 9, 6, 4, 7, 5, 8, 3].map((height, index) => <span key={index} className="wave-bar" style={{ height: `${height * 3}px`, animationDelay: `${index * 80}ms` }} />)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/50"><Waves size={12} className="text-[#A795FF]" /> AI feedback is listening</div>
          </FloatingCard>
        </div>

        <div className="absolute bottom-[13%] right-[13%] hidden lg:block">
          <FloatingCard className="w-44" delay={1.8} duration={7.8}>
            <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[.16em] text-white/45">Career momentum</span><ArrowUpRight size={14} className="text-[#B6CFC0]" /></div>
            <div className="mt-2 flex items-end gap-1.5"><span className="font-display text-3xl font-semibold text-white">+38%</span><BriefcaseBusiness size={16} className="mb-1 text-[#B6CFC0]" /></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[#B6CFC0]" animate={{ width: ["35%", "72%", "35%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} /></div>
          </FloatingCard>
        </div>

        <motion.div
          className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#1d3328]/80 shadow-[0_0_70px_rgba(182,207,192,.35)] backdrop-blur-xl"
          animate={{ boxShadow: ["0 0 45px rgba(182,207,192,.2)", "0 0 85px rgba(167,149,255,.35)", "0 0 45px rgba(182,207,192,.2)"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-2 rounded-full border border-dashed border-white/20" />
          <Sparkles size={26} className="text-[#B6CFC0]" />
          <span className="absolute -bottom-7 whitespace-nowrap text-[10px] uppercase tracking-[.2em] text-white/45">HireSense intelligence</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
