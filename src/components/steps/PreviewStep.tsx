// PreviewStep.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
    ArrowLeft, Flower2, RefreshCw, CheckCircle2,
    AlertCircle, Shuffle, Plus, X,
} from "lucide-react";
import { useFlow, PreviewFlower } from "@/contexts/FlowContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type FlowerMood = Database["public"]["Enums"]["flower_mood"];

interface DBFlower {
    id: string;
    name: string;
    price_per_stem: number;
    image_url: string | null;
    stock: number;
    in_stock: boolean;
    mood: FlowerMood;
}

const MOOD_LABELS: Record<string, string> = {
    romantic: "Romantic",
    joyful: "Joyful",
    calm: "Calm",
    grateful: "Grateful",
    sympathetic: "Sympathetic",
    celebratory: "Celebratory",
};

// ── selectAndAllocate ─────────────────────────────────────────
function selectAndAllocate(
    availableFlowers: DBFlower[],
    budget: number,
    lockedIds: Set<string>,
    current: PreviewFlower[]
): PreviewFlower[] {
    if (!availableFlowers.length) return [];

    const usable = Math.floor(budget * 0.9);
    const locked: PreviewFlower[] = current.filter((f) => lockedIds.has(f.flowerId));
    const lockedSpent = locked.reduce((s, f) => s + f.subtotal, 0);
    const remainingBudget = usable - lockedSpent;

    const pool = availableFlowers.filter(
        (f) => f.in_stock && f.stock > 0 && !lockedIds.has(f.id)
    );

    if (!pool.length && !locked.length) return [];
    if (!pool.length) return locked;

    const maxFromPool = Math.max(1, Math.min(pool.length, 4 - locked.length));
    const minFromPool = Math.min(pool.length, Math.max(1, 2 - locked.length));
    const targetCount = Math.floor(Math.random() * (maxFromPool - minFromPool + 1)) + minFromPool;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, targetCount);

    const perFlower = shuffled.length ? Math.floor(remainingBudget / shuffled.length) : 0;
    const newItems: PreviewFlower[] = shuffled.map((f) => {
        const stems = Math.max(1, Math.floor(perFlower / f.price_per_stem));
        return {
            flowerId: f.id,
            flowerName: f.name,
            pricePerStem: f.price_per_stem,
            stems,
            subtotal: stems * f.price_per_stem,
            imageUrl: f.image_url,
        };
    });

    const allItems = [...locked, ...newItems];
    const spent = allItems.reduce((s, f) => s + f.subtotal, 0);
    let remaining = usable - spent;
    let idx = 0;
    let safety = 200;
    while (remaining > 0 && safety-- > 0) {
        const item = allItems[idx % allItems.length];
        const dbFlower = availableFlowers.find((f) => f.id === item.flowerId);
        const maxExtra = dbFlower ? dbFlower.stock - item.stems : 0;
        if (item.pricePerStem <= remaining && maxExtra > 0) {
            item.stems += 1;
            item.subtotal += item.pricePerStem;
            remaining -= item.pricePerStem;
        }
        idx++;
        if (idx >= allItems.length * 3) break;
    }
    return allItems;
}

// ── CatalogModal (dùng cho cả Swap & Add) ────────────────────
const CatalogModal = ({
    mode,
    allCatalog,
    excludeIds,
    currentMood,
    onSelect,
    onClose,
}: {
    mode: "swap" | "add";
    allCatalog: DBFlower[];
    excludeIds: string[];
    currentMood: FlowerMood | null;
    onSelect: (flower: DBFlower) => void;
    onClose: () => void;
}) => {
    const [filterMood, setFilterMood] = useState<FlowerMood | "all">("all");

    // Lấy danh sách mood có trong catalog
    const uniqueMoods = Array.from(
        new Set<FlowerMood>(allCatalog.map((f) => f.mood))
    );

    const moods: Array<FlowerMood | "all"> = ["all", ...uniqueMoods];

    const displayed = allCatalog.filter((f) => {
        if (!f.in_stock || f.stock === 0) return false;
        if (excludeIds.includes(f.id)) return false;
        if (filterMood !== "all" && f.mood !== (filterMood as FlowerMood)) return false;
        return true;
    });

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="relative w-full max-w-md bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
                    <div>
                        <h3 className="text-sm font-display font-semibold text-foreground">
                            {mode === "swap" ? "Đổi loại hoa" : "Thêm hoa vào bó"}
                        </h3>
                        <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                            {displayed.length} loại có thể chọn
                        </p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mood filter chips */}
                <div className="px-4 py-2.5 flex gap-2 overflow-x-auto shrink-0 border-b border-border/30 scrollbar-none">
                    {moods.map((m) => (
                        <button
                            key={m}
                            onClick={() => setFilterMood(m)}
                            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-body font-medium transition-all border ${filterMood === m
                                    ? "bg-primary text-white border-primary"
                                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            {m === "all" ? "Tất cả" : MOOD_LABELS[m] ?? m}
                            {m !== "all" && m === currentMood && (<span className="ml-1 opacity-70">✦</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Flower list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {displayed.length === 0 ? (
                        <div className="text-center py-10 px-6">
                            <div className="text-3xl mb-3">🌸</div>
                            <p className="text-sm font-body text-muted-foreground">Không còn hoa nào để chọn.</p>
                        </div>
                    ) : (
                        displayed.map((flower) => (
                            <button
                                key={flower.id}
                                onClick={() => onSelect(flower)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 transition-colors text-left"
                            >
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-pink-soft/30">
                                    {flower.image_url ? (
                                        <img src={flower.image_url} alt={flower.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">🌸</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-sm font-body font-semibold text-foreground truncate">{flower.name}</p>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-body capitalize shrink-0">
                                            {MOOD_LABELS[flower.mood] ?? flower.mood}
                                        </span>
                                    </div>
                                    <p className="text-xs font-body text-primary mt-0.5">{flower.price_per_stem.toLocaleString()}đ/cành</p>
                                </div>
                                <div className="shrink-0">
                                    {flower.stock <= 5 ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-body">
                                            Còn {flower.stock}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-body">
                                            Còn {flower.stock}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Main PreviewStep ───────────────────────────────────────────
export const PreviewStep = () => {
    const { data, updateData, goNext, goBack } = useFlow();

    const [allCatalog, setAllCatalog] = useState<DBFlower[]>([]);
    const [preview, setPreview] = useState<PreviewFlower[]>([]);
    const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [swapTarget, setSwapTarget] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const totalCost = preview.reduce((s, f) => s + f.subtotal, 0);
    const totalStems = preview.reduce((s, f) => s + f.stems, 0);
    const overBudget = totalCost > data.budget;

    // Fetch TẤT CẢ hoa trong DB (không filter mood)
    useEffect(() => {
        if (!data.mood) return;
        setLoading(true);
        supabase
            .from("flowers")
            .select("id, name, price_per_stem, image_url, stock, in_stock, mood")
            .order("mood")
            .order("price_per_stem", { ascending: true })
            .then(({ data: flowers }) => {
                const list = (flowers as DBFlower[]) ?? [];
                setAllCatalog(list);

                // Preview ban đầu: chỉ dùng hoa cùng mood, còn hàng
                const moodInStock = list.filter((f) => f.mood === data.mood && f.in_stock && f.stock > 0);
                if (moodInStock.length) {
                    setPreview(selectAndAllocate(moodInStock, data.budget, new Set(), []));
                }
                setLoading(false);
            });
    }, [data.mood, data.budget]);

    // Shuffle (chỉ trong mood, giữ locked)
    const handleReshuffle = () => {
        const moodInStock = allCatalog.filter((f) => f.mood === data.mood && f.in_stock && f.stock > 0);
        setPreview(selectAndAllocate(moodInStock, data.budget, lockedIds, preview));
        toast.success("Đã chọn lại combination mới!");
    };

    const toggleLock = (flowerId: string) => {
        setLockedIds((prev) => {
            const next = new Set(prev);
            next.has(flowerId) ? next.delete(flowerId) : next.add(flowerId);
            return next;
        });
    };

    // Swap
    const handleSwap = (index: number, newFlower: DBFlower) => {
        const updated = [...preview];
        const oldItem = updated[index];
        const stems = Math.max(1, Math.floor(oldItem.subtotal / newFlower.price_per_stem));
        updated[index] = {
            flowerId: newFlower.id,
            flowerName: newFlower.name,
            pricePerStem: newFlower.price_per_stem,
            stems,
            subtotal: stems * newFlower.price_per_stem,
            imageUrl: newFlower.image_url,
        };
        setPreview(updated);
        setLockedIds((prev) => new Set([...prev, newFlower.id]));
        setSwapTarget(null);
        toast.success(`Đã đổi sang ${newFlower.name}!`);
    };

    // Add (thêm 1 cành mặc định, có thể tăng/giảm sau)
    const handleAdd = (flower: DBFlower) => {
        setPreview((prev) => [
            ...prev,
            {
                flowerId: flower.id,
                flowerName: flower.name,
                pricePerStem: flower.price_per_stem,
                stems: 1,
                subtotal: flower.price_per_stem,
                imageUrl: flower.image_url,
            },
        ]);
        setLockedIds((prev) => new Set([...prev, flower.id]));
        setShowAddModal(false);
        toast.success(`Đã thêm ${flower.name} vào bó hoa!`);
    };

    // Adjust stems
    const adjustStems = (index: number, delta: number) => {
        setPreview((prev) => {
            const updated = [...prev];
            const item = { ...updated[index] };
            const dbFlower = allCatalog.find((f) => f.id === item.flowerId);
            const maxStock = dbFlower?.stock ?? 999;
            item.stems = Math.max(1, Math.min(maxStock, item.stems + delta));
            item.subtotal = item.stems * item.pricePerStem;
            updated[index] = item;
            return updated;
        });
    };

    // Remove
    const handleRemove = (index: number) => {
        const removed = preview[index];
        setPreview((prev) => prev.filter((_, i) => i !== index));
        setLockedIds((prev) => {
            const next = new Set(prev);
            next.delete(removed.flowerId);
            return next;
        });
    };

    const handleConfirm = async () => {
        setConfirming(true);
        updateData({
            previewFlowers: preview,
            totalCost,
            selectedFlowerIds: preview.map((f) => f.flowerId),
        });
        setTimeout(() => { setConfirming(false); goNext(); }, 400);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    const moodInStock = allCatalog.filter((f) => f.mood === data.mood && f.in_stock && f.stock > 0);
    if (!moodInStock.length && preview.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
                <AlertCircle className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm font-body text-muted-foreground">
                    Hiện không có hoa nào trong mood này. Vui lòng chọn mood khác.
                </p>
                <Button variant="secondary" onClick={goBack}>Quay lại chọn mood</Button>
            </div>
        );
    }

    const currentPreviewIds = preview.map((f) => f.flowerId);

    return (
        <>
            <div className="flex flex-col min-h-screen px-6 md:px-12 py-8 max-w-4xl mx-auto w-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <motion.button onClick={goBack} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-xs font-body tracking-wide">Back</span>
                    </motion.button>
                    <button onClick={handleReshuffle}
                        className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/40">
                        <Shuffle className="w-3.5 h-3.5" />
                        Chọn lại
                    </button>
                </div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <p className="text-[10px] font-body tracking-[0.35em] uppercase text-primary/50 mb-2">Xem trước bó hoa</p>
                    <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground leading-tight mb-2">
                        Đây là bó hoa<br />của bạn
                    </h2>
                    <p className="text-sm font-body text-muted-foreground">
                        AI đã chọn {preview.length} loại hoa. Bạn có thể đổi, thêm từng loại hoặc shuffle lại.
                    </p>
                </motion.div>

                {/* Flower cards */}
                <div className="flex flex-col gap-3 mb-4">
                    <AnimatePresence mode="popLayout">
                        {preview.map((flower, i) => {
                            const isLocked = lockedIds.has(flower.flowerId);
                            return (
                                <motion.div key={flower.flowerId} layout
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                                    className={`bg-card rounded-2xl border overflow-hidden transition-all duration-200 ${isLocked ? "border-primary/40 shadow-sm" : "border-border/60"
                                        }`}
                                >
                                    <div className="flex items-center gap-4 p-4">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-pink-soft/30">
                                            {flower.imageUrl ? (
                                                <img src={flower.imageUrl} alt={flower.flowerName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className="text-sm font-display font-semibold text-foreground truncate">{flower.flowerName}</p>
                                                {isLocked && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-body shrink-0">Đã giữ</span>
                                                )}
                                            </div>
                                            <p className="text-xs font-body text-muted-foreground mb-1.5">
                                                {flower.pricePerStem.toLocaleString()}đ/cành
                                            </p>
                                            {/* Stems adjuster */}
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => adjustStems(i, -1)}
                                                    className="w-6 h-6 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-xs font-bold leading-none">
                                                    −
                                                </button>
                                                <span className="text-xs font-body font-semibold text-foreground w-14 text-center">
                                                    {flower.stems} cành
                                                </span>
                                                <button onClick={() => adjustStems(i, 1)}
                                                    className="w-6 h-6 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-xs font-bold leading-none">
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-body font-bold text-primary">{flower.subtotal.toLocaleString()}đ</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex border-t border-border/30">
                                        <button onClick={() => toggleLock(flower.flowerId)}
                                            className={`flex-1 py-2 text-[11px] font-body transition-colors ${isLocked ? "text-primary hover:bg-primary/5" : "text-muted-foreground hover:bg-secondary/50"
                                                }`}>
                                            {isLocked ? "✓ Đang giữ" : "Giữ loại này"}
                                        </button>
                                        <div className="w-px bg-border/30" />
                                        <button onClick={() => setSwapTarget(i)}
                                            className="flex-1 py-2 text-[11px] font-body text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors flex items-center justify-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            Đổi loại khác
                                        </button>
                                        <div className="w-px bg-border/30" />
                                        <button onClick={() => handleRemove(i)}
                                            className="px-4 py-2 text-[11px] font-body text-red-400 hover:bg-red-50 transition-colors">
                                            Xoá
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Add button */}
                <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-dashed border-primary/40 text-primary text-xs font-body hover:bg-primary/5 hover:border-primary/60 transition-all mb-5"
                >
                    <Plus className="w-4 h-4" />
                    Thêm loại hoa khác
                </motion.button>

                {/* Summary */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="glass-card rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Flower2 className="w-4 h-4 text-primary" />
                            <p className="text-sm font-display font-semibold text-foreground">Tóm tắt</p>
                        </div>
                        <p className="text-xs font-body text-muted-foreground">{totalStems} cành tổng</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-body text-muted-foreground">Chi phí hoa</p>
                            <p className={`text-xl font-display font-semibold ${overBudget ? "text-red-500" : "text-foreground"}`}>
                                {totalCost.toLocaleString()}đ
                            </p>
                        </div>
                        <div className="text-right">
                            {overBudget ? (
                                <>
                                    <p className="text-xs font-body text-red-400">Vượt ngân sách</p>
                                    <p className="text-sm font-body text-red-500 font-semibold">+{(totalCost - data.budget).toLocaleString()}đ</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-body text-muted-foreground">Còn lại (bao bì)</p>
                                    <p className="text-sm font-body text-muted-foreground">~{(data.budget - totalCost).toLocaleString()}đ</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${overBudget ? "bg-red-400" : "gradient-gold"}`}
                            animate={{ width: `${Math.min(100, (totalCost / data.budget) * 100)}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                    <p className={`text-[10px] font-body mt-1 text-right ${overBudget ? "text-red-400" : "text-muted-foreground/50"}`}>
                        {Math.round((totalCost / data.budget) * 100)}% ngân sách
                        {overBudget && " — vượt budget nhưng vẫn có thể đặt"}
                    </p>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                    className="flex flex-col gap-3">
                    <Button variant="hero" size="lg" className="w-full rounded-2xl"
                        disabled={confirming || preview.length === 0} onClick={handleConfirm}>
                        {confirming ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 rounded-full border-2 border-white border-t-transparent mr-2" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Xác nhận & Gen ảnh
                            </>
                        )}
                    </Button>
                    <p className="text-center text-[10px] font-body text-muted-foreground/40 tracking-wide">
                        AI sẽ tạo ảnh bó hoa dựa trên lựa chọn của bạn
                    </p>
                </motion.div>
            </div>

            {/* Swap modal */}
            <AnimatePresence>
                {swapTarget !== null && (
                    <CatalogModal
                        mode="swap"
                        allCatalog={allCatalog}
                        excludeIds={preview.filter((_, i) => i !== swapTarget).map((f) => f.flowerId)}
                        currentMood={data.mood}
                        onSelect={(flower) => handleSwap(swapTarget, flower)}
                        onClose={() => setSwapTarget(null)}
                    />
                )}
            </AnimatePresence>

            {/* Add modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CatalogModal
                        mode="add"
                        allCatalog={allCatalog}
                        excludeIds={currentPreviewIds}
                        currentMood={data.mood}
                        onSelect={handleAdd}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};