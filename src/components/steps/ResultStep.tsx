// ResultStep.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Flower2, RotateCcw, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

const loadingPhrases = [
  "Selecting the freshest blooms...",
  "Composing your arrangement...",
  "Adding finishing touches...",
  "Wrapping with love...",
];

export const ResultStep = () => {
  const { data, reset } = useFlow();

  const [loading, setLoading]                   = useState(true);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [orderId, setOrderId]                   = useState<string | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex]           = useState(0);

  // Phrase rotator
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setPhraseIndex((i) => (i + 1) % loadingPhrases.length), 2200);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => { generateBouquet(); }, []);

  const generateBouquet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dùng previewFlowers đã được user confirm từ PreviewStep
      const flowers = data.previewFlowers.map((f) => ({
        id: f.flowerId,
        name: f.flowerName,
        price_per_stem: f.pricePerStem,
      }));

      const { data: genData, error: genError } = await supabase.functions.invoke("generate-bouquet", {
        body: {
          mood:        data.mood,
          recipient:   data.recipient,
          budget:      data.budget,
          description: data.description,
          flowers,                  // ← subset đã chọn, không lấy hết
          stemBreakdown: data.previewFlowers, // edge function có thể dùng luôn
        },
      });

      if (genError) throw genError;
      if (!genData?.imageUrl) throw new Error("No image generated");

      setGeneratedImageUrl(genData.imageUrl);

      // Build ingredient strings từ previewFlowers (đã có sẵn từ context)
      const ingredientStrings = data.previewFlowers.map(
        (f) =>
          `${f.flowerName} · ${f.pricePerStem.toLocaleString()}đ/cành × ${f.stems} = ${f.subtotal.toLocaleString()}đ`
      );

      // Lưu order (status = "pending" — chưa trừ stock)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          mood:               data.mood!,
          recipient_type:     data.recipient,
          budget:             data.budget,
          user_description:   data.description || null,
          selected_flower_ids: data.previewFlowers.map((f) => f.flowerId),
          generated_image_url: genData.imageUrl,
          qr_code_data:       crypto.randomUUID(),
          ingredients:        ingredientStrings,
          status:             "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;
      setOrderId(order.id);
    } catch (err: any) {
      setError(err.message || "Failed to generate bouquet");
      toast.error("Failed to generate bouquet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = orderId ? `${window.location.origin}/bouquet/${orderId}` : "";

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center max-w-xs">
          <div className="relative mb-10">
            <motion.div className="absolute inset-[-16px] rounded-full border border-primary/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }} />
            <motion.div className="absolute inset-[-8px] rounded-full border border-dashed border-primary/25"
              animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
            <motion.div className="w-24 h-24 rounded-full gradient-pink flex items-center justify-center shadow-xl shadow-primary/20"
              animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Flower2 className="w-11 h-11 text-primary-foreground" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-display font-semibold text-foreground mb-3">Crafting your bouquet</h2>
          <div className="h-5 mb-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p key={phraseIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
                className="text-sm font-body text-muted-foreground italic">
                {loadingPhrases[phraseIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-pink-soft flex items-center justify-center mx-auto mb-6">
            <Flower2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground font-body text-sm mb-8 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <Button variant="hero" className="w-full rounded-2xl" onClick={generateBouquet}>
              <RotateCcw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground" onClick={reset}>
              Start Over
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────
  const preview = data.previewFlowers;
  const totalCost = data.totalCost;

  return (
    <div className="flex flex-col min-h-screen px-6 md:px-12 py-8 max-w-5xl mx-auto w-full gap-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-body tracking-[0.3em] uppercase text-muted-foreground/50 mb-1">Complete</p>
          <h2 className="text-4xl font-display font-semibold text-foreground leading-tight">Your Bouquet</h2>
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </motion.div>
      </motion.div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

        {/* LEFT: Image + ingredients */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-4">

          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 aspect-[4/5]">
            {generatedImageUrl && (
              <img src={generatedImageUrl} alt="Your bouquet" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/60 shadow-sm">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-body font-semibold text-primary capitalize">{data.mood}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px] font-body font-medium text-foreground capitalize">
                  For {data.recipient}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-[10px] font-body font-medium text-foreground">
                  {data.budget.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>

          {/* Ingredients breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flower2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-display font-semibold text-foreground">Thành phần bó hoa</p>
              </div>
              <span className="text-[10px] font-body text-muted-foreground">
                {preview.reduce((s, f) => s + f.stems, 0)} cành tổng
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {preview.map((item, i) => (
                <motion.div key={item.flowerId}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-center gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.flowerName}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-semibold text-foreground leading-none mb-0.5 truncate">
                      {item.flowerName}
                    </p>
                    <p className="text-[10px] font-body text-muted-foreground">
                      {item.pricePerStem.toLocaleString()}đ/cành
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-body text-muted-foreground">×</span>
                    <span className="text-sm font-body font-bold text-foreground w-6 text-center">{item.stems}</span>
                  </div>
                  <div className="shrink-0 text-right w-20">
                    <p className="text-xs font-body font-semibold text-primary">{item.subtotal.toLocaleString()}đ</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs font-body text-muted-foreground">Chi phí hoa</span>
              <span className="text-sm font-display font-semibold text-foreground">{totalCost.toLocaleString()}đ</span>
            </div>
            <p className="text-[10px] font-body text-muted-foreground/50 mt-1 text-right">
              ~{(data.budget - totalCost).toLocaleString()}đ còn lại cho bao bì & ruy băng
            </p>
          </motion.div>
        </motion.div>

        {/* RIGHT: Summary + QR + CTA */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col gap-4">

          {/* Order summary */}
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] font-body tracking-[0.25em] uppercase text-muted-foreground/50 mb-4">Order Summary</p>
            <div className="space-y-4">
              {[
                { label: "Mood",    value: data.mood },
                { label: "For",     value: data.recipient },
                { label: "Budget",  value: `${data.budget.toLocaleString()} VNĐ` },
              ].map((row, i) => (
                <div key={row.label}>
                  {i > 0 && <div className="h-px bg-border/40 mb-4" />}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-body text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-body font-semibold text-foreground capitalize">{row.value}</p>
                  </div>
                </div>
              ))}
              {data.description && (
                <>
                  <div className="h-px bg-border/40" />
                  <div>
                    <p className="text-xs font-body text-muted-foreground mb-1.5">Your note</p>
                    <p className="text-xs font-body text-foreground/70 italic leading-relaxed">"{data.description}"</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* QR Code */}
          {orderId && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground leading-none">Bill QR Code</p>
                  <p className="text-[10px] font-body text-muted-foreground mt-0.5">Đưa mã này cho nhân viên để xác nhận</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-border/30 shrink-0">
                  <QRCodeSVG value={shareUrl} size={110} bgColor="#ffffff" fgColor="hsl(340,10%,15%)" level="M" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-body text-muted-foreground leading-relaxed">
                    Scan để xem và xác nhận đơn hàng tại quầy.
                  </p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-soft border border-primary/15 text-[10px] font-body text-primary w-fit">
                    ✦ Pending — chờ nhân viên xác nhận
                  </span>
                  <p className="text-[10px] font-body text-muted-foreground/60">
                    Stock sẽ được trừ sau khi nhân viên xác nhận đơn.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col gap-3 mt-auto">
            <Button variant="hero" size="lg" className="w-full rounded-2xl" onClick={reset}>
              <Flower2 className="w-4 h-4 mr-2" /> Create New Bouquet
            </Button>
            <p className="text-center text-[10px] tracking-[0.25em] uppercase text-muted-foreground/35 font-body">
              Thank you for choosing Fleuréa ✦
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};