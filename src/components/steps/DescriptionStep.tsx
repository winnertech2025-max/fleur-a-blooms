// DescriptionStep.tsx
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";

const suggestions = [
  { label: "Pastel tones", emoji: "🌸" },
  { label: "Minimal & clean", emoji: "✦" },
  { label: "Wild & natural", emoji: "🌿" },
  { label: "Bold colors", emoji: "🌺" },
  { label: "Soft & romantic", emoji: "💗" },
  { label: "Earthy tones", emoji: "🍂" },
];

export const DescriptionStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();

  const appendSuggestion = (label: string) => {
    updateData({ description: data.description ? `${data.description}, ${label}` : label });
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
            <div key={i} className={`rounded-full transition-all duration-300 ${i === 3 ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-primary/25"}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-16 md:items-start flex-1">
        {/* Left header */}
        <motion.div className="md:w-64 md:shrink-0 mb-8 md:mb-0 md:sticky md:top-8"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-body tracking-[0.35em] uppercase text-primary/50 mb-3">Step 4 of 4</p>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-foreground mb-4 leading-tight">
            Any special<br />wishes?
          </h2>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            Describe colors, textures, or styles you love. The more detail, the more tailored your bouquet.
          </p>
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s.label} onClick={() => appendSuggestion(s.label)}
                className="px-3 py-1.5 rounded-full border border-primary/20 bg-pink-soft text-primary text-xs font-body hover:bg-primary/10 hover:border-primary/40 transition-all">
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right: textarea + actions */}
        <motion.div className="flex-1 flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="relative">
            <textarea
              placeholder="E.g., I love pastel colors with eucalyptus leaves, something elegant and minimal..."
              value={data.description}
              onChange={(e) => updateData({ description: e.target.value })}
              rows={8}
              className="w-full p-5 rounded-2xl border border-border bg-card font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all text-sm leading-relaxed"
            />
            <p className="absolute bottom-4 right-4 text-[11px] font-body text-muted-foreground/40">
              {data.description?.length ?? 0} / 300
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="hero" size="lg" className="w-full rounded-2xl" onClick={goNext}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate My Bouquet
            </Button>
            <Button variant="ghost" size="lg" className="w-full rounded-2xl text-muted-foreground text-sm"
              onClick={() => { updateData({ description: "" }); goNext(); }}>
              Skip & Generate
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};