// SplashScreen.tsx
import { motion } from "framer-motion";
import { Flower2, Sparkles } from "lucide-react";
import { PetalBackground } from "@/components/PetalBackground";
import { GlassFilter, GlassEffect } from "@/components/ui/liquid-glass";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen = ({ onStart }: SplashScreenProps) => {
  return (
    <div className="relative flex items-center justify-center min-h-screen px-8 overflow-hidden animated-gradient-bg">
      <GlassFilter />
      <PetalBackground />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/6 blur-[100px]" />
      </div>

      {/* Rotating rings */}
      <motion.div className="absolute w-[500px] h-[500px] rounded-full border border-primary/8"
        animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full border border-gold/10"
        animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />

      {/* iPad: side-by-side layout */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        {/* Left: Branding */}
        <motion.div
          className="flex flex-col items-center md:items-start text-center md:text-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Emblem */}
          <motion.div className="relative mb-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <motion.div className="absolute inset-[-20px] rounded-full border border-dashed border-primary/20"
              animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
            <div className="w-28 h-28 rounded-full gradient-pink flex items-center justify-center shadow-2xl shadow-primary/20 relative">
              <div className="absolute inset-2 rounded-full border border-white/30" />
              <Flower2 className="w-14 h-14 text-primary-foreground drop-shadow" />
            </div>
          </motion.div>

          <motion.p className="text-[11px] font-body font-medium tracking-[0.4em] text-primary/50 uppercase mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            AI Floral Atelier
          </motion.p>

          <motion.h1 className="text-7xl md:text-8xl font-display font-semibold tracking-tight text-foreground mb-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
            FLEURÉA
          </motion.h1>

          <motion.div className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.6, duration: 0.6 }}>
            <div className="w-16 h-px gradient-gold" />
            <div className="w-1.5 h-1.5 rotate-45 bg-gold" />
            <div className="w-16 h-px gradient-gold" />
          </motion.div>

          <motion.p className="text-xl font-body text-foreground/70 italic mb-3 tracking-wide"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            Pick your bloom. Wrap your moment.
          </motion.p>

          <motion.p className="text-sm font-body text-muted-foreground leading-relaxed max-w-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
            Discover the perfect bouquet crafted by AI, tailored to your emotions and style.
          </motion.p>
        </motion.div>

        {/* Right: CTA card */}
        <motion.div
          className="flex flex-col items-center md:items-start gap-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        >
          {/* Feature pills */}
          <div className="w-full flex flex-col gap-4">
            {[
              { icon: "✦", text: "Mood-based bouquet design" },
              { icon: "✿", text: "Tailored to your recipient" },
              { icon: "★", text: "Fits your exact budget" },
            ].map((f, i) => (
              <motion.div key={f.text}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.12 }}
                className="w-full"
              >
                <GlassEffect
                  className="flex items-center gap-4 w-full rounded-2xl px-5 py-4 bg-white/60 shadow-lg shadow-black/5"
                  overlayColor="rgba(255, 255, 255, 0.4)"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-base shrink-0">
                    {f.icon}
                  </div>
                  <span className="font-body text-sm text-foreground/80 font-medium z-10 relative">{f.text}</span>
                </GlassEffect>
              </motion.div>
            ))}
          </div>

          {/* Liquid Glass CTA & Dock */}
          <motion.div className="w-full pt-4 flex flex-col items-center gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            
<div className="w-full">
              <Button variant="cartoon" size="xl" onClick={onStart} className="w-full">
                <Flower2 className="w-6 h-6" />
                <span>Start Your Journey</span>
              </Button>
              <p className="text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 font-body mt-4 font-semibold">
                Free · No sign-up required
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Sparkles */}
      {[
        { pos: "top-[15%] left-[8%]", delay: 1.2 },
        { pos: "top-[20%] right-[6%]", delay: 1.8 },
        { pos: "bottom-[18%] left-[5%]", delay: 1.5 },
        { pos: "bottom-[15%] right-[10%]", delay: 2.0 },
      ].map((s, i) => (
        <motion.div key={i} className={`absolute ${s.pos} text-gold/40 pointer-events-none`}
          animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ delay: s.delay, duration: 3, repeat: Infinity, repeatDelay: 3 + i }}>
          <Sparkles className="w-4 h-4" />
        </motion.div>
      ))}

      {/* Corner brackets */}
      {["top-6 left-6", "top-6 right-6 rotate-90", "bottom-6 left-6 -rotate-90", "bottom-6 right-6 rotate-180"].map((pos, i) => (
        <motion.div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 + i * 0.1 }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full opacity-25">
            <path d="M2 30V6C2 3.8 3.8 2 6 2h24" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};