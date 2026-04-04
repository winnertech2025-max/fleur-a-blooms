// RecipientStep.tsx
import { motion, Variants } from "framer-motion";
import { Heart, Users, Briefcase, User, Gift, GraduationCap, ArrowLeft } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";

const recipients: { value: string; label: string; icon: React.ElementType; description: string; particle: string }[] = [
  { value: "partner", label: "Partner", icon: Heart, description: "Romantic & intimate", particle: "♡" },
  { value: "friend", label: "Friend", icon: Users, description: "Warm & cheerful", particle: "✦" },
  { value: "family", label: "Family", icon: User, description: "Loving & tender", particle: "◦" },
  { value: "colleague", label: "Colleague", icon: Briefcase, description: "Elegant & refined", particle: "·" },
  { value: "celebration", label: "Celebration", icon: Gift, description: "Festive & bright", particle: "✿" },
  { value: "graduation", label: "Graduation", icon: GraduationCap, description: "Proud & vibrant", particle: "★" },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

export const RecipientStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();
  const handleSelect = (recipient: string) => { updateData({ recipient }); setTimeout(goNext, 240); };

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
            <div key={i} className={`rounded-full transition-all duration-300 ${i === 1 ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/25"}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-16 md:items-start flex-1">
        <motion.div className="md:w-64 md:shrink-0 mb-8 md:mb-0 md:sticky md:top-8"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-body tracking-[0.35em] uppercase text-primary/50 mb-3">Step 2 of 4</p>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-foreground mb-4 leading-tight">
            Who is<br />it for?
          </h2>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            The recipient shapes the style. A bouquet for a partner feels different from one for a colleague.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-primary/30" />
            <span className="text-[10px] font-body tracking-[0.2em] uppercase text-muted-foreground/50">Select one</span>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          {recipients.map((r) => {
            const isSelected = data.recipient === r.value;
            return (
              <motion.button key={r.value} variants={item}
                whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(r.value)}
                className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all duration-200 overflow-hidden text-left bg-card ${
                  isSelected ? "ring-2 ring-primary shadow-lg border-transparent" : "border-border/60 hover:border-primary/30 hover:shadow-md"
                }`}
              >
                {isSelected && <motion.div className="absolute inset-0 bg-primary/5 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
                <span className="absolute right-4 bottom-3 text-5xl text-primary opacity-[0.06] font-serif select-none pointer-events-none leading-none">{r.particle}</span>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-primary/15" : "bg-primary/8"}`}>
                  <r.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-foreground leading-none mb-1">{r.label}</p>
                  <p className="font-body text-[11px] text-muted-foreground leading-tight">{r.description}</p>
                </div>
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};