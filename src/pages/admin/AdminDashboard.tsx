import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flower2, Package, LogOut, Plus, Pencil, Trash2,
  Image as ImageIcon, Eye, X, Search, ChevronDown, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { QRCodeSVG } from "qrcode.react";

type Flower     = Database["public"]["Tables"]["flowers"]["Row"];
type Order      = Database["public"]["Tables"]["orders"]["Row"];
type FlowerMood = Database["public"]["Enums"]["flower_mood"];

const moods: FlowerMood[] = ["romantic","joyful","calm","grateful","sympathetic","celebratory"];
const ORDER_STATUSES = ["pending","confirmed","preparing","ready","completed","cancelled"];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-50  text-amber-700  border-amber-200"  },
  confirmed: { label: "Confirmed", cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  preparing: { label: "Preparing", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  ready:     { label: "Ready",     cls: "bg-teal-50   text-teal-700   border-teal-200"   },
  completed: { label: "Completed", cls: "bg-green-50  text-green-700  border-green-200"  },
  cancelled: { label: "Cancelled", cls: "bg-red-50    text-red-700    border-red-200"    },
};

const MOOD_EMOJI: Record<string, string> = {
  romantic:"🌹", joyful:"🌻", calm:"🪷",
  grateful:"🌼", sympathetic:"🤍", celebratory:"🎉",
};

const StatCard = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) => (
  <div className="bg-card border border-border/60 rounded-2xl p-4">
    <p className="text-[11px] font-body text-muted-foreground uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className={`text-3xl font-display font-semibold ${accent ?? "text-foreground"}`}>{value}</p>
    {sub && <p className="text-[11px] font-body text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const FilterPill = ({ label, active, count, onClick }: { label: string; active: boolean; count?: number; onClick: () => void }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition-all duration-150 ${
    active ? "bg-pink-soft text-primary border-primary/30 font-semibold" : "bg-card text-muted-foreground border-border/60 hover:border-primary/30"
  }`}>
    {label}
    {count !== undefined && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{count}</span>
    )}
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const m = STATUS_META[status] ?? { label: status, cls: "bg-secondary text-foreground border-border" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold border ${m.cls}`}>{m.label}</span>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]               = useState<"flowers" | "orders">("orders");
  const [flowers, setFlowers]                   = useState<Flower[]>([]);
  const [orders, setOrders]                     = useState<Order[]>([]);
  const [showFlowerForm, setShowFlowerForm]     = useState(false);
  const [editingFlower, setEditingFlower]       = useState<Flower | null>(null);
  const [selectedOrder, setSelectedOrder]       = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId]   = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter]         = useState("all");
  const [searchQuery, setSearchQuery]           = useState("");
  const [flowerForm, setFlowerForm] = useState({
    name: "", price_per_stem: "", mood: "romantic" as FlowerMood,
    description: "", image_url: "", in_stock: true, stock: "0",
  });

  useEffect(() => { checkAuth(); fetchFlowers(); fetchOrders(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles?.length) navigate("/admin");
  };

  const fetchFlowers = async () => {
    const { data } = await supabase.from("flowers").select("*").order("created_at", { ascending: false });
    if (data) setFlowers(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin"); };

  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === "pending").length,
    completed: orders.filter(o => o.status === "completed").length,
    revenue:   orders.reduce((s, o) => s + (o.budget ?? 0), 0),
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter(o => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSearch = !q || o.mood?.toLowerCase().includes(q) || o.recipient_type?.toLowerCase().includes(q) || (o.user_description ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach(s => { c[s] = orders.filter(o => o.status === s).length; });
    return c;
  }, [orders]);

  // ── Trừ stock khi completed ──────────────────────────────────
  const deductStock = async (order: Order) => {
    if (!order.selected_flower_ids?.length || !order.ingredients?.length) return;
    for (let i = 0; i < order.selected_flower_ids.length; i++) {
      const flowerId = order.selected_flower_ids[i];
      const ing = order.ingredients[i];
      if (!ing) continue;
      const match = ing.match(/×\s*(\d+)/);
      if (!match) continue;
      const stems = parseInt(match[1]);
      const { data: flower } = await supabase.from("flowers").select("stock").eq("id", flowerId).single();
      if (!flower) continue;
      const newStock = Math.max(0, (flower.stock ?? 0) - stems);
      await supabase.from("flowers").update({ stock: newStock, in_stock: newStock > 0 }).eq("id", flowerId);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatusId(orderId);
    const order = orders.find(o => o.id === orderId);
    const wasCompleted = order?.status === "completed";
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setUpdatingStatusId(null);
    if (error) { toast.error(error.message); return; }
    if (newStatus === "completed" && !wasCompleted && order) {
      await deductStock(order);
      toast.success("✓ Hoàn thành — stock đã được trừ!");
      fetchFlowers();
    } else {
      toast.success(`Trạng thái → ${newStatus}`);
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(o => o ? { ...o, status: newStatus } : o);
  };

  const handleDeleteOrder = async (id: string) => {
    setDeletingOrderId(id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    setDeletingOrderId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã xoá đơn hàng!");
    if (selectedOrder?.id === id) setSelectedOrder(null);
    fetchOrders();
  };

  const handleSaveFlower = async () => {
    const stockValue = parseInt(flowerForm.stock) || 0;
    const payload = {
      name: flowerForm.name, price_per_stem: parseFloat(flowerForm.price_per_stem),
      mood: flowerForm.mood, description: flowerForm.description,
      image_url: flowerForm.image_url || null, in_stock: stockValue > 0, stock: stockValue,
    };
    const { error } = editingFlower
      ? await supabase.from("flowers").update(payload).eq("id", editingFlower.id)
      : await supabase.from("flowers").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editingFlower ? "Đã cập nhật!" : "Đã thêm hoa!");
    setShowFlowerForm(false); setEditingFlower(null);
    setFlowerForm({ name: "", price_per_stem: "", mood: "romantic", description: "", image_url: "", in_stock: true, stock: "0" });
    fetchFlowers();
  };

  const handleDeleteFlower = async (id: string) => {
    const { error } = await supabase.from("flowers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã xoá!"); fetchFlowers();
  };

  const handleEditFlower = (f: Flower) => {
    setEditingFlower(f);
    setFlowerForm({ name: f.name, price_per_stem: f.price_per_stem.toString(), mood: f.mood,
      description: f.description || "", image_url: f.image_url || "", in_stock: f.in_stock, stock: (f.stock ?? 0).toString() });
    setShowFlowerForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("flowers").upload(path, file);
    if (error) { toast.error("Upload thất bại"); return; }
    const { data: { publicUrl } } = supabase.storage.from("flowers").getPublicUrl(path);
    setFlowerForm(f => ({ ...f, image_url: publicUrl }));
    toast.success("Đã upload ảnh!");
  };

  const getStockBadge = (flower: Flower) => {
    const s = flower.stock ?? 0;
    if (s === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-body bg-red-50 text-red-700 border border-red-200 font-semibold">Hết hàng</span>;
    if (s <= 5)  return <span className="text-[10px] px-2 py-0.5 rounded-full font-body bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Còn {s}</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-body bg-green-50 text-green-700 border border-green-200 font-semibold">Còn {s}</span>;
  };

  const shareUrl = (id: string) => `${window.location.origin}/bouquet/${id}`;

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-card border-b border-border/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-soft flex items-center justify-center">
            <Flower2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-foreground leading-none">Fleuréa</p>
            <p className="text-[10px] font-body text-muted-foreground">Admin dashboard</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground text-xs">
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
        </Button>
      </div>

      {/* Tab bar */}
      <div className="bg-card border-b border-border/60 px-6 flex gap-1">
        {(["orders","flowers"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-body border-b-2 transition-all capitalize ${
              activeTab === tab ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab === "orders" ? <Package className="w-3.5 h-3.5" /> : <Flower2 className="w-3.5 h-3.5" />}
            {tab}
            {tab === "orders" && <span className="text-[10px] bg-pink-soft text-primary px-1.5 py-0.5 rounded-full">{orders.length}</span>}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* ══ ORDERS ══════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total orders" value={stats.total} sub="all time" />
              <StatCard label="Pending"      value={stats.pending}   sub="need action" accent="text-amber-600" />
              <StatCard label="Completed"    value={stats.completed} sub="fulfilled"   accent="text-green-600" />
              <StatCard label="Revenue"      value={`${(stats.revenue/1_000_000).toFixed(1)}M đ`} sub="total budget" />
            </div>

            <AnimatePresence>
              {selectedOrder && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="bg-card border border-border/60 rounded-2xl p-5 mb-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-display font-semibold text-foreground">Chi tiết đơn hàng</h3>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => setSelectedOrder(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
                    {selectedOrder.generated_image_url
                      ? <img src={selectedOrder.generated_image_url} alt="Bouquet" className="w-full md:w-44 aspect-square object-cover rounded-xl border border-border/40" />
                      : <div className="w-full md:w-44 aspect-square rounded-xl bg-pink-soft/50 flex items-center justify-center text-5xl">{MOOD_EMOJI[selectedOrder.mood ?? ""] ?? "🌸"}</div>
                    }
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                        {[["Mood", selectedOrder.mood], ["Recipient", selectedOrder.recipient_type],
                          ["Budget", `${selectedOrder.budget?.toLocaleString()} VNĐ`],
                          ["Date", new Date(selectedOrder.created_at).toLocaleDateString("vi-VN")]].map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-0.5">{k}</p>
                            <p className="text-sm font-body font-semibold text-foreground capitalize">{v}</p>
                          </div>
                        ))}
                        {selectedOrder.user_description && (
                          <div className="col-span-2">
                            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-0.5">Note</p>
                            <p className="text-sm font-body text-foreground/80 italic">"{selectedOrder.user_description}"</p>
                          </div>
                        )}
                      </div>

                      {selectedOrder.ingredients?.length ? (
                        <div className="border-t border-border/40 pt-3">
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">Ingredients</p>
                          <div className="flex flex-col gap-1.5">
                            {selectedOrder.ingredients.map((ing, i) => {
                              const [left, cost] = ing.split(" = ");
                              return (
                                <div key={i} className="flex items-center justify-between text-xs font-body">
                                  <span className="text-foreground/80">{left}</span>
                                  {cost && <span className="text-primary font-semibold">{cost}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {/* Status update — nổi bật completed */}
                      <div className="border-t border-border/40 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Update status</p>
                          {selectedOrder.status !== "completed" && (
                            <span className="text-[9px] font-body text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              "Completed" → trừ stock
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ORDER_STATUSES.map(s => {
                            const isActive = selectedOrder.status === s;
                            const m = STATUS_META[s];
                            return (
                              <button key={s}
                                disabled={updatingStatusId === selectedOrder.id}
                                onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                className={`text-[11px] px-3 py-1.5 rounded-full font-body border transition-all flex items-center gap-1 ${
                                  isActive ? `${m.cls} font-semibold scale-105`
                                  : s === "completed" ? "bg-green-50 text-green-700 border-green-200 hover:scale-105"
                                  : "bg-secondary text-muted-foreground border-transparent hover:opacity-80"
                                }`}>
                                {s === "completed" && <CheckCircle className="w-3 h-3" />}
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-border/40 pt-3">
                        <div className="flex flex-col items-start gap-1">
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Bill QR</p>
                          <div className="bg-white p-2 rounded-xl border border-border/30">
                            <QRCodeSVG value={shareUrl(selectedOrder.id)} size={80} bgColor="#ffffff" fgColor="hsl(340,10%,15%)" level="M" />
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" className="rounded-xl"
                          disabled={deletingOrderId === selectedOrder.id}
                          onClick={() => handleDeleteOrder(selectedOrder.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          {deletingOrderId === selectedOrder.id ? "Đang xoá..." : "Xoá đơn"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FilterPill label="All" active={statusFilter === "all"} count={statusCounts.all} onClick={() => setStatusFilter("all")} />
              {ORDER_STATUSES.map(s => (
                <FilterPill key={s} label={STATUS_META[s].label} active={statusFilter === s} count={statusCounts[s]} onClick={() => setStatusFilter(s)} />
              ))}
              <div className="ml-auto flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…"
                  className="text-xs font-body bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-36" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {filteredOrders.length === 0 && (
                <div className="text-center py-16 text-muted-foreground font-body text-sm">
                  <Package className="w-10 h-10 mx-auto mb-3 text-border" /> No orders match.
                </div>
              )}
              {filteredOrders.map(order => (
                <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}
                  className={`bg-card rounded-xl border transition-all duration-150 p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm ${
                    selectedOrder?.id === order.id ? "border-primary/40 shadow-sm" : "border-border/60 hover:border-border"
                  }`}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {order.generated_image_url
                      ? <img src={order.generated_image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-pink-soft/50 flex items-center justify-center text-xl">{MOOD_EMOJI[order.mood ?? ""] ?? "🌸"}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-body font-semibold text-foreground capitalize">{order.mood} · {order.recipient_type}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs font-body text-muted-foreground truncate">
                      {order.budget?.toLocaleString()}đ · {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      {order.user_description && ` · "${order.user_description}"`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <select value={order.status} disabled={updatingStatusId === order.id}
                        onChange={e => handleUpdateStatus(order.id, e.target.value)}
                        className="text-[11px] pl-2.5 pr-6 py-1.5 rounded-full font-body border border-border/60 bg-card appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary text-foreground">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => setSelectedOrder(prev => prev?.id === order.id ? null : order)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 w-7 p-0"
                      disabled={deletingOrderId === order.id} onClick={() => handleDeleteOrder(order.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FLOWERS ════════════════════════════════════════ */}
        {activeTab === "flowers" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-semibold text-foreground">Flower inventory</h2>
              <Button variant="hero" size="sm" className="rounded-xl" onClick={() => {
                setShowFlowerForm(true); setEditingFlower(null);
                setFlowerForm({ name: "", price_per_stem: "", mood: "romantic", description: "", image_url: "", in_stock: true, stock: "0" });
              }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm hoa
              </Button>
            </div>

            <AnimatePresence>
              {showFlowerForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="bg-card border border-border/60 rounded-2xl p-5 mb-5">
                  <h3 className="text-sm font-display font-semibold mb-4">{editingFlower ? "Sửa" : "Thêm"} hoa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input placeholder="Tên hoa" value={flowerForm.name} onChange={e => setFlowerForm(f => ({ ...f, name: e.target.value }))}
                      className="p-3 rounded-xl border border-border/60 bg-card font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                    <input placeholder="Giá/cành (VNĐ)" type="number" value={flowerForm.price_per_stem} onChange={e => setFlowerForm(f => ({ ...f, price_per_stem: e.target.value }))}
                      className="p-3 rounded-xl border border-border/60 bg-card font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                    <select value={flowerForm.mood} onChange={e => setFlowerForm(f => ({ ...f, mood: e.target.value as FlowerMood }))}
                      className="p-3 rounded-xl border border-border/60 bg-card font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      {moods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-body text-muted-foreground px-1">Tồn kho</label>
                      <input placeholder="0 = hết hàng" type="number" min="0" value={flowerForm.stock} onChange={e => setFlowerForm(f => ({ ...f, stock: e.target.value }))}
                        className="p-3 rounded-xl border border-border/60 bg-card font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <textarea placeholder="Mô tả" value={flowerForm.description} onChange={e => setFlowerForm(f => ({ ...f, description: e.target.value }))}
                      className="p-3 rounded-xl border border-border/60 bg-card font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary md:col-span-2" rows={2} />
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/40 cursor-pointer hover:bg-secondary transition-colors">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span className="font-body text-sm text-muted-foreground">Upload ảnh</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {flowerForm.image_url && <img src={flowerForm.image_url} alt="Preview" className="w-16 h-16 object-cover rounded-lg mt-2" />}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="hero" size="sm" className="rounded-xl" onClick={handleSaveFlower}>Lưu</Button>
                    <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => { setShowFlowerForm(false); setEditingFlower(null); }}>Huỷ</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flowers.map(flower => (
                <motion.div key={flower.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-sm transition-shadow">
                  {flower.image_url
                    ? <div className="h-36 overflow-hidden"><img src={flower.image_url} alt={flower.name} className="w-full h-full object-cover" /></div>
                    : <div className="h-36 bg-pink-soft/30 flex items-center justify-center text-4xl">{MOOD_EMOJI[flower.mood] ?? "🌸"}</div>
                  }
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="text-sm font-display font-semibold text-foreground">{flower.name}</h4>
                        <p className="text-xs text-muted-foreground font-body capitalize">{flower.mood}</p>
                      </div>
                      {getStockBadge(flower)}
                    </div>
                    <p className="text-sm font-body text-primary font-semibold mt-2 mb-3">{flower.price_per_stem.toLocaleString()} VNĐ/cành</p>
                    {flower.description && <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-3">{flower.description}</p>}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs" onClick={() => handleEditFlower(flower)}>
                        <Pencil className="w-3 h-3 mr-1" /> Sửa
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1 rounded-xl text-xs" onClick={() => handleDeleteFlower(flower.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Xoá
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {flowers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-body text-sm">
                <Flower2 className="w-10 h-10 mx-auto mb-3 text-border" /> Chưa có hoa nào.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;