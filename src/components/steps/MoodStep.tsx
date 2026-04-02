import { motion } from "framer-motion";
import { Heart, Smile, Leaf, Star, CloudRain, PartyPopper, ArrowLeft } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Database } from "@/integrations/supabase/types";

type FlowerMood = Database["public"]["Enums"]["flower_mood"];

const moods: { value: FlowerMood; label: string; icon: React.ElementType; color: string }[] = [
  { value: "romantic", label: "Romantic", icon: Heart, color: "bg-pink-soft text-pink-deep" },
  { value: "joyful", label: "Joyful", icon: Smile, color: "bg-secondary text-gold" },
  { value: "calm", label: "Calm", icon: Leaf, color: "bg-muted text-muted-foreground" },
  { value: "grateful", label: "Grateful", icon: Star, color: "bg-gold-light text-gold" },
  { value: "sympathetic", label: "Sympathetic", icon: CloudRain, color: "bg-secondary text-foreground" },
  { value: "celebratory", label: "Celebratory", icon: PartyPopper, color: "bg-pink-soft text-primary" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export const MoodStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();

  const handleSelect = (mood: FlowerMood) => {
    updateData({ mood });
    goNext();
  };

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      <button onClick={goBack} className="self-start mb-4 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h2 className="text-3xl font-display font-semibold text-foreground mb-2 text-center">
        How are you feeling?
      </h2>
      <p className="text-muted-foreground font-body text-sm mb-8 text-center">
        Choose the mood that matches this moment
      </p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 w-full"
      >
        {moods.map((mood) => (
          <motion.button
            key={mood.value}
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(mood.value)}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border border-border transition-all duration-200 hover:shadow-lg ${
              data.mood === mood.value ? "ring-2 ring-primary shadow-md" : ""
            } ${mood.color}`}
          >
            <mood.icon className="w-8 h-8" />
            <span className="font-body font-medium text-sm">{mood.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
