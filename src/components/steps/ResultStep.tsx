import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, Flower2, RotateCcw, QrCode } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const ResultStep = () => {
  const { data, reset } = useFlow();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateBouquet();
  }, []);

  const generateBouquet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch flowers matching the mood
      const { data: flowers } = await supabase
        .from("flowers")
        .select("*")
        .eq("mood", data.mood!)
        .eq("in_stock", true);

      const flowerNames = flowers?.map((f) => f.name) || [];
      const flowerIngredients = flowers?.map((f) => `${f.name} - ${f.price_per_stem.toLocaleString()} VNĐ/stem`) || [];

      // Call edge function to generate bouquet image
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-bouquet", {
        body: {
          mood: data.mood,
          recipient: data.recipient,
          budget: data.budget,
          description: data.description,
          flowerNames,
        },
      });

      if (genError) throw genError;

      const imageUrl = genData?.imageUrl;
      if (!imageUrl) throw new Error("No image generated");

      setGeneratedImageUrl(imageUrl);
      setIngredients(flowerIngredients.length > 0 ? flowerIngredients : [`${data.mood} flowers selection`]);

      // Create order
      const qrData = crypto.randomUUID();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          mood: data.mood!,
          recipient_type: data.recipient,
          budget: data.budget,
          user_description: data.description || null,
          selected_flower_ids: flowers?.map((f) => f.id) || [],
          generated_image_url: imageUrl,
          qr_code_data: qrData,
          ingredients: flowerIngredients.length > 0 ? flowerIngredients : [`${data.mood} flowers selection`],
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      setOrderId(order.id);
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate bouquet");
      toast.error("Failed to generate bouquet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = orderId
    ? `${window.location.origin}/bouquet/${orderId}`
    : "";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <div className="w-20 h-20 rounded-full gradient-pink flex items-center justify-center">
              <Flower2 className="w-10 h-10 text-primary-foreground" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-4" />
          </motion.div>

          <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
            Crafting your bouquet...
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            Our AI is designing something beautiful just for you
          </p>

          <motion.div className="flex gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
            Oops, something went wrong
          </h2>
          <p className="text-muted-foreground font-body mb-6">{error}</p>
          <div className="flex gap-3">
            <Button variant="hero" onClick={generateBouquet}>
              <RotateCcw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button variant="outline-primary" onClick={reset}>
              Start Over
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <h2 className="text-3xl font-display font-semibold text-foreground mb-1">
          Your Bouquet
        </h2>
        <p className="text-muted-foreground font-body text-sm mb-6">
          Designed with love, just for you
        </p>
      </motion.div>

      {/* Generated Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full aspect-square rounded-2xl overflow-hidden shadow-xl mb-6 border border-border"
      >
        {generatedImageUrl && (
          <img
            src={generatedImageUrl}
            alt="Your generated bouquet"
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>

      {/* Ingredients */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full glass-card rounded-2xl p-5 mb-6"
      >
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Flower2 className="w-4 h-4 text-primary" /> Ingredients
        </h3>
        <ul className="space-y-1">
          {ingredients.map((ing, i) => (
            <li key={i} className="text-sm font-body text-muted-foreground">
              • {ing}
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm font-body">
            <span className="text-muted-foreground">Mood:</span>{" "}
            <span className="font-medium text-foreground capitalize">{data.mood}</span>
          </p>
          <p className="text-sm font-body">
            <span className="text-muted-foreground">For:</span>{" "}
            <span className="font-medium text-foreground capitalize">{data.recipient}</span>
          </p>
          <p className="text-sm font-body">
            <span className="text-muted-foreground">Budget:</span>{" "}
            <span className="font-medium text-foreground">{data.budget.toLocaleString()} VNĐ</span>
          </p>
        </div>
      </motion.div>

      {/* QR Code */}
      {orderId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full glass-card rounded-2xl p-6 mb-6 flex flex-col items-center"
        >
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Your Bill QR</h3>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              bgColor="transparent"
              fgColor="hsl(340, 10%, 15%)"
              level="M"
            />
          </div>
          <p className="text-xs font-body text-muted-foreground mt-3 text-center">
            Scan to view your bouquet details
          </p>
        </motion.div>
      )}

      <div className="flex gap-3 w-full">
        <Button variant="hero" size="lg" className="flex-1 rounded-xl" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-2" /> New Bouquet
        </Button>
      </div>
    </div>
  );
};
