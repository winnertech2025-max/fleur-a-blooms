import { motion } from "framer-motion";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator = ({ totalSteps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-1.5 rounded-full transition-colors duration-300 ${
            i <= currentStep ? "bg-primary" : "bg-border"
          }`}
          initial={false}
          animate={{
            width: i === currentStep ? 32 : 12,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
};
