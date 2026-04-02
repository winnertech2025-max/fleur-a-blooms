import { motion } from "framer-motion";
import { Heart, Users, Briefcase, User, Gift, GraduationCap, ArrowLeft } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";

const recipients = [
  { value: "partner", label: "Partner", icon: Heart },
  { value: "friend", label: "Friend", icon: Users },
  { value: "family", label: "Family", icon: User },
  { value: "colleague", label: "Colleague", icon: Briefcase },
  { value: "celebration", label: "Celebration", icon: Gift },
  { value: "graduation", label: "Graduation", icon: GraduationCap },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export const RecipientStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();

  const handleSelect = (recipient: string) => {
    updateData({ recipient });
    goNext();
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      <button onClick={goBack} className="self-start mb-4 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-3xl font-display font-semibold text-foreground mb-2 text-center">
        Who is it for?
      </h2>
      <p className="text-muted-foreground font-body text-sm mb-8 text-center">
        Select the recipient of your bouquet
      </p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 w-full"
      >
        {recipients.map((r) => (
          <motion.button
            key={r.value}
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(r.value)}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg ${
              data.recipient === r.value ? "ring-2 ring-primary shadow-md" : ""
            }`}
          >
            <r.icon className="w-7 h-7 text-primary" />
            <span className="font-body font-medium text-sm text-foreground">{r.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
