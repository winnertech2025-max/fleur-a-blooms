import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";

export const PetalBackground = () => {
  const petals = Array.from({ length: 8 });
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/10"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
            y: -50,
            rotate: 0,
            opacity: 0.3,
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 900,
            rotate: 720,
            opacity: 0,
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear",
          }}
        >
          <Flower2 size={16 + Math.random() * 16} />
        </motion.div>
      ))}
    </div>
  );
};
