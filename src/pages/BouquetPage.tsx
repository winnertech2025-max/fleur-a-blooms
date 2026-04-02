import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Flower2, QrCode, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface OrderData {
  id: string;
  mood: string;
  recipient_type: string;
  budget: number;
  user_description: string | null;
  generated_image_url: string | null;
  ingredients: string[] | null;
  created_at: string;
}

const BouquetPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Flower2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-6">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Bouquet not found</h2>
        <Button variant="hero" onClick={() => window.location.href = "/"}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flower2 className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-semibold tracking-wide text-foreground">FLEURÉA</h1>
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground">Your Bouquet</h2>
        </motion.div>

        {order.generated_image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full aspect-square rounded-2xl overflow-hidden shadow-xl mb-6 border border-border"
          >
            <img src={order.generated_image_url} alt="Bouquet" className="w-full h-full object-cover" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5 mb-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" /> Order Details
          </h3>
          <div className="space-y-2 text-sm font-body">
            <p><span className="text-muted-foreground">Mood:</span> <span className="font-medium text-foreground capitalize">{order.mood}</span></p>
            <p><span className="text-muted-foreground">For:</span> <span className="font-medium text-foreground capitalize">{order.recipient_type}</span></p>
            <p><span className="text-muted-foreground">Budget:</span> <span className="font-medium text-foreground">{order.budget.toLocaleString()} VNĐ</span></p>
            {order.user_description && (
              <p><span className="text-muted-foreground">Note:</span> <span className="font-medium text-foreground">{order.user_description}</span></p>
            )}
          </div>
        </motion.div>

        {order.ingredients && order.ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-5"
          >
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-primary" /> Ingredients
            </h3>
            <ul className="space-y-1">
              {order.ingredients.map((ing, i) => (
                <li key={i} className="text-sm font-body text-muted-foreground">• {ing}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BouquetPage;
