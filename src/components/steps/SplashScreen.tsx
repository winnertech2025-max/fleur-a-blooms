import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetalBackground } from "@/components/PetalBackground";

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen = ({ onStart }: SplashScreenProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-cream">
      <PetalBackground />
      
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-md"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-full gradient-pink flex items-center justify-center shadow-lg">
            <Flower2 className="w-10 h-10 text-primary-foreground" />
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-foreground mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          FLEURÉA
        </motion.h1>

        <motion.div
          className="w-16 h-0.5 gradient-gold rounded-full mb-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        />

        <motion.p
          className="text-lg font-body text-muted-foreground italic mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Pick your bloom. Wrap your moment.
        </motion.p>

        <motion.p
          className="text-sm font-body text-muted-foreground mb-10 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Discover the perfect bouquet crafted by AI, tailored to your emotions and style.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <Button variant="hero" size="xl" onClick={onStart} className="rounded-full px-12">
            <Flower2 className="w-5 h-5 mr-2" />
            Start Your Journey
          </Button>
        </motion.div>
      </motion.div>

      {/* Decorative circles */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 rounded-full bg-primary/5"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-24 h-24 rounded-full bg-gold/10"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
};
