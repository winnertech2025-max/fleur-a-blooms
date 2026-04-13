// MoodStep.tsx
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Heart, Smile, Leaf, Star, CloudRain, PartyPopper, ArrowLeft, X } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Database } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type FlowerMood = Database["public"]["Enums"]["flower_mood"];

interface FlowerRow {
  id: string;
  name: string;
  price_per_stem: number;
  image_url: string | null;
  stock: number;
  in_stock: boolean;
}

const moods: {
  value: FlowerMood;
  label: string;
  icon: React.ElementType;
  color: string;
  ring: string;
  description: string;
  particle: string;
}[] = [
  { value: "romantic",    label: "Romantic",    icon: Heart,       color: "bg-pink-soft text-pink-deep",      ring: "ring-pink-deep/40",        description: "Roses & soft petals",    particle: "❤" },
  { value: "joyful",      label: "Joyful",      icon: Smile,       color: "bg-secondary text-gold",           ring: "ring-gold/40",             description: "Sunflowers & warmth",    particle: "✦" },
  { value: "calm",        label: "Calm",        icon: Leaf,        color: "bg-muted text-muted-foreground",   ring: "ring-muted-foreground/30", description: "Lavender & greens",      particle: "◦" },
  { value: "grateful",    label: "Grateful",    icon: Star,        color: "bg-gold-light text-gold",          ring: "ring-gold/40",             description: "Warm dahlias & golds",   particle: "★" },
  { value: "sympathetic", label: "Sympathetic", icon: CloudRain,   color: "bg-secondary text-foreground",     ring: "ring-foreground/20",       description: "White lilies & care",    particle: "·" },
  { value: "celebratory", label: "Celebratory", icon: PartyPopper, color: "bg-pink-soft text-primary",        ring: "ring-primary/40",          description: "Bold & bright blooms",   particle: "✿" },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

// ── Flower hover panel ────────────────────────────────────────
const MoodFlowerPanel = ({
  mood,
  onClose,
}: {
  mood: (typeof moods)[0];
  onClose: () => void;
}) => {
  const [flowers, setFlowers] = useState<FlowerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("flowers")
      .select("id, name, price_per_stem, image_url, stock, in_stock")
      .eq("mood", mood.value)
      .order("price_per_stem", { ascending: true })
      .then(({ data }) => {
        setFlowers((data as FlowerRow[]) ?? []);
        setLoading(false);
      });
  }, [mood.value]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="absolute right-0 top-0 bottom-0 w-[260px] md:w-[300px] bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 z-20 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className={`${mood.color} px-4 py-3 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2">
          <mood.icon className="w-4 h-4" />
          <p className="text-sm font-display font-semibold capitalize">{mood.label}</p>
        </div>
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] font-body text-muted-foreground px-4 py-2 border-b border-border/40 shrink-0">
        {flowers.length} loại hoa trong mood này
      </p>

      {/* Flower list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <motion.div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : flowers.length === 0 ? (
          <p className="text-center text-sm font-body text-muted-foreground py-8">
            Chưa có hoa nào
          </p>
        ) : (
          flowers.map((flower, i) => (
            <motion.div
              key={flower.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-pink-soft/30">
                {flower.image_url ? (
                  <img src={flower.image_url} alt={flower.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🌸</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-semibold text-foreground truncate">{flower.name}</p>
                <p className="text-[10px] font-body text-primary">{flower.price_per_stem.toLocaleString()}đ/cành</p>
              </div>

              {/* Stock */}
              {flower.stock === 0 ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-body shrink-0">Hết</span>
              ) : flower.stock <= 5 ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-body shrink-0">Còn {flower.stock}</span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-body shrink-0">Còn {flower.stock}</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────────
export const MoodStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();
  const [hoveredMood, setHoveredMood] = useState<(typeof moods)[0] | null>(null);

  const handleSelect = (mood: FlowerMood) => {
    updateData({ mood });
    setHoveredMood(null);
    setTimeout(goNext, 240);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 md:px-12 py-8 max-w-4xl mx-auto w-full">
      {/* Back + progress */}
      <div className="flex items-center justify-between mb-10">
        <motion.button onClick={goBack} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-body tracking-wide">Back</span>
        </motion.button>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === 0 ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/25"}`} />
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row md:gap-16 md:items-start flex-1">

        {/* Left header */}
        <motion.div className="md:w-64 md:shrink-0 mb-8 md:mb-0 md:sticky md:top-8"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-body tracking-[0.35em] uppercase text-primary/50 mb-3">Step 1 of 4</p>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-foreground mb-4 leading-tight">
            How are<br />you feeling?
          </h2>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            Choose the mood that best matches this moment. Hover to preview the flowers in each mood.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-primary/30" />
            <span className="text-[10px] font-body tracking-[0.2em] uppercase text-muted-foreground/50">Select one</span>
          </div>
        </motion.div>

        {/* Right: grid + panel */}
        <div className="flex-1 relative">
          <motion.div variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {moods.map((mood) => {
              const isSelected = data.mood === mood.value;
              const isHovered = hoveredMood?.value === mood.value;

              return (
                <motion.button
                  key={mood.value}
                  variants={item}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(mood.value)}
                  onHoverStart={() => setHoveredMood(mood)}
                  onHoverEnd={() => {}}
                  className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all duration-200 overflow-hidden text-left ${mood.color} ${
                    isSelected
                      ? `ring-2 ${mood.ring} shadow-lg border-transparent`
                      : isHovered
                      ? `ring-1 ${mood.ring} shadow-md border-transparent`
                      : "border-border/60 hover:border-transparent hover:shadow-md"
                  }`}
                >
                  {isSelected && (
                    <motion.div className="absolute inset-0 opacity-[0.12] bg-current rounded-2xl"
                      initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} />
                  )}
                  <span className="absolute right-4 bottom-3 text-5xl opacity-[0.08] font-serif select-none pointer-events-none leading-none">
                    {mood.particle}
                  </span>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-current/15" : "bg-current/10"}`}>
                    <mood.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-sm leading-none mb-1">{mood.label}</p>
                    <p className="font-body text-[11px] opacity-55 leading-tight">{mood.description}</p>
                  </div>

                  {/* Hint hover */}
                  {!isSelected && (
                    <p className="text-[9px] font-body opacity-40 mt-auto">Hover để xem hoa →</p>
                  )}

                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Hover flower panel */}
          <AnimatePresence>
            {hoveredMood && (
              <MoodFlowerPanel
                mood={hoveredMood}
                onClose={() => setHoveredMood(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};