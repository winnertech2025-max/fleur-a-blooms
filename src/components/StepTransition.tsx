import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StepTransitionProps {
  children: ReactNode;
  stepKey: string;
  direction?: "forward" | "backward";
}

const variants = {
  enter: (direction: string) => ({
    x: direction === "forward" ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: string) => ({
    x: direction === "forward" ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export const StepTransition = ({ children, stepKey, direction = "forward" }: StepTransitionProps) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
