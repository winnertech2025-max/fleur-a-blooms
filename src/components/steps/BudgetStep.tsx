// BudgetStep.tsx
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Banknote, PenLine, TrendingUp } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const budgetOptions = [
  { value: 200000, label: "200K VNĐ", hint: "Simple & sweet", bar: 20 },
  { value: 350000, label: "350K VNĐ", hint: "Charming mix", bar: 35 },
  { value: 500000, label: "500K VNĐ", hint: "Elegant bouquet", bar: 50 },
  { value: 800000, label: "800K VNĐ", hint: "Lush & full", bar: 80 },
  { value: 1000000, label: "1M VNĐ", hint: "Grand & luxurious", bar: 100 },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

export const BudgetStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (value: number) => {
    updateData({ budget: value, customBudget: "" });
    setShowCustom(false);
    setTimeout(goNext, 240);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(data.customBudget);
    if (val > 0) { updateData({ budget: val }); goNext(); }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 md:px-12 py-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-10">
        <motion.button onClick={goBack} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-body tracking-wide">Back</span>
        </motion.button>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === 2 ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/25"}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-16 md:items-start flex-1">
        {/* Left header */}
        <motion.div className="md:w-64 md:shrink-0 mb-8 md:mb-0 md:sticky md:top-8"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-body tracking-[0.35em] uppercase text-primary/50 mb-3">Step 3 of 4</p>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-foreground mb-4 leading-tight">
            Your<br />budget
          </h2>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            Choose how much you'd like to spend. More budget means more flowers and variety.
          </p>
          {/* Budget visualizer */}
          {data.budget > 0 && !showCustom && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-body uppercase tracking-[0.2em] text-muted-foreground">Selected</span>
              </div>
              <p className="text-2xl font-display font-semibold text-foreground mb-3">
                {data.budget.toLocaleString()}đ
              </p>
              <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                <motion.div className="h-full gradient-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetOptions.find(o => o.value === data.budget)?.bar ?? 0}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right: budget list */}
        <div className="flex-1 flex flex-col gap-3">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
            {budgetOptions.map((opt) => {
              const isSelected = data.budget === opt.value && !showCustom;
              return (
                <motion.button key={opt.value} variants={item}
                  whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(opt.value)}
                  className={`relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-200 overflow-hidden text-left ${
                    isSelected ? "ring-2 ring-primary shadow-lg border-transparent bg-card" : "border-border/60 bg-card hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  {isSelected && <motion.div className="absolute inset-0 bg-primary/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-primary/15" : "bg-secondary"}`}>
                    <Banknote className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="font-body font-semibold text-foreground text-sm leading-none mb-0.5">{opt.label}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{opt.hint}</p>
                  </div>
                  {/* Progress bar inside row */}
                  <div className="w-20 h-1 bg-border/30 rounded-full overflow-hidden shrink-0">
                    <div className="h-full gradient-gold rounded-full transition-all duration-500"
                      style={{ width: isSelected ? `${opt.bar}%` : "0%" }} />
                  </div>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 relative z-10">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}

            <motion.button variants={item} whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.99 }}
              onClick={() => { setShowCustom(true); updateData({ budget: 0 }); }}
              className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-200 text-left ${
                showCustom ? "ring-2 ring-primary border-transparent bg-card shadow-lg" : "border-dashed border-primary/40 bg-card hover:border-primary/60 hover:shadow-md"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${showCustom ? "bg-primary/15" : "gradient-gold"}`}>
                <PenLine className={`w-5 h-5 ${showCustom ? "text-primary" : "text-accent-foreground"}`} />
              </div>
              <div>
                <p className="font-body font-semibold text-foreground text-sm leading-none mb-0.5">Custom amount</p>
                <p className="font-body text-[11px] text-muted-foreground">Enter any budget you like</p>
              </div>
            </motion.button>
          </motion.div>

          {showCustom && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <input type="number" placeholder="Enter amount (VNĐ)" value={data.customBudget}
                onChange={(e) => updateData({ customBudget: e.target.value })}
                autoFocus
                className="w-full p-4 rounded-2xl border border-border bg-card font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Button variant="hero" size="lg" className="w-full rounded-2xl"
              disabled={showCustom && !data.customBudget}
              onClick={() => { if (showCustom) handleCustomSubmit(); else goNext(); }}>
              Continue
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};