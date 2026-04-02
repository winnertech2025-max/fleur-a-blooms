import { motion } from "framer-motion";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const budgetOptions = [
  { value: 200000, label: "200K VNĐ" },
  { value: 350000, label: "350K VNĐ" },
  { value: 500000, label: "500K VNĐ" },
  { value: 800000, label: "800K VNĐ" },
  { value: 1000000, label: "1M VNĐ" },
];

export const BudgetStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (value: number) => {
    updateData({ budget: value, customBudget: "" });
    setShowCustom(false);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(data.customBudget);
    if (val > 0) {
      updateData({ budget: val });
      goNext();
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      <button onClick={goBack} className="self-start mb-4 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-3xl font-display font-semibold text-foreground mb-2 text-center">
        Your budget
      </h2>
      <p className="text-muted-foreground font-body text-sm mb-8 text-center">
        Select a range or enter your own
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.06 }}
        className="flex flex-col gap-3 w-full mb-6"
      >
        {budgetOptions.map((opt) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md ${
              data.budget === opt.value && !showCustom ? "ring-2 ring-primary shadow-md" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="font-body font-medium text-foreground">{opt.label}</span>
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCustom(true)}
          className={`flex items-center gap-4 p-4 rounded-xl border border-dashed border-primary/40 bg-card transition-all duration-200 hover:shadow-md ${
            showCustom ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-body font-medium text-foreground">Custom amount</span>
        </motion.button>
      </motion.div>

      {showCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="w-full mb-6"
        >
          <input
            type="number"
            placeholder="Enter amount (VNĐ)"
            value={data.customBudget}
            onChange={(e) => updateData({ customBudget: e.target.value })}
            className="w-full p-4 rounded-xl border border-border bg-card font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </motion.div>
      )}

      <Button
        variant="hero"
        size="lg"
        className="w-full rounded-xl"
        disabled={data.budget <= 0 && !data.customBudget}
        onClick={() => {
          if (showCustom) handleCustomSubmit();
          else goNext();
        }}
      >
        Continue
      </Button>
    </div>
  );
};
