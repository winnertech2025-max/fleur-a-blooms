import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";

export const DescriptionStep = () => {
  const { data, updateData, goNext, goBack } = useFlow();

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      <button onClick={goBack} className="self-start mb-4 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <h2 className="text-3xl font-display font-semibold text-foreground mb-2">
          Any special wishes?
        </h2>
        <p className="text-muted-foreground font-body text-sm mb-8">
          Tell us about any preferences, colors, or styles you love
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full mb-6"
      >
        <textarea
          placeholder="E.g., I love pastel colors with eucalyptus leaves, something elegant and minimal..."
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={5}
          className="w-full p-4 rounded-xl border border-border bg-card font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full space-y-3"
      >
        <Button
          variant="hero"
          size="lg"
          className="w-full rounded-xl"
          onClick={goNext}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate My Bouquet
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full rounded-xl text-muted-foreground"
          onClick={() => {
            updateData({ description: "" });
            goNext();
          }}
        >
          Skip & Generate
        </Button>
      </motion.div>
    </div>
  );
};
