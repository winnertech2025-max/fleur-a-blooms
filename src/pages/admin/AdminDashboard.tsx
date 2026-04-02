import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flower2, Package, LogOut, Plus, Pencil, Trash2, Image as ImageIcon, QrCode, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { QRCodeSVG } from "qrcode.react";

type Flower = Database["public"]["Tables"]["flowers"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type FlowerMood = Database["public"]["Enums"]["flower_mood"];

const moods: FlowerMood[] = ["romantic", "joyful", "calm", "grateful", "sympathetic", "celebratory"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"flowers" | "orders">("flowers");
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showFlowerForm, setShowFlowerForm] = useState(false);
  const [editingFlower, setEditingFlower] = useState<Flower | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [flowerForm, setFlowerForm] = useState({
    name: "",
    price_per_stem: "",
    mood: "romantic" as FlowerMood,
    description: "",
    image_url: "",
    in_stock: true,
  });

  useEffect(() => {
    checkAuth();
    fetchFlowers();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      navigate("/admin");
    }
  };

  const fetchFlowers = async () => {
    const { data } = await supabase.from("flowers").select("*").order("created_at", { ascending: false });
    if (data) setFlowers(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const handleSaveFlower = async () => {
    const payload = {
      name: flowerForm.name,
      price_per_stem: parseFloat(flowerForm.price_per_stem),
      mood: flowerForm.mood,
      description: flowerForm.description,
      image_url: flowerForm.image_url || null,
      in_stock: flowerForm.in_stock,
    };

    if (editingFlower) {
      const { error } = await supabase.from("flowers").update(payload).eq("id", editingFlower.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Flower updated!");
    } else {
      const { error } = await supabase.from("flowers").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Flower added!");
    }

    setShowFlowerForm(false);
    setEditingFlower(null);
    setFlowerForm({ name: "", price_per_stem: "", mood: "romantic", description: "", image_url: "", in_stock: true });
    fetchFlowers();
  };

  const handleDeleteFlower = async (id: string) => {
    const { error } = await supabase.from("flowers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Flower deleted!");
    fetchFlowers();
  };

  const handleEditFlower = (flower: Flower) => {
    setEditingFlower(flower);
    setFlowerForm({
      name: flower.name,
      price_per_stem: flower.price_per_stem.toString(),
      mood: flower.mood,
      description: flower.description || "",
      image_url: flower.image_url || "",
      in_stock: flower.in_stock,
    });
    setShowFlowerForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("flowers").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("flowers").getPublicUrl(path);
    setFlowerForm((f) => ({ ...f, image_url: publicUrl }));
    toast.success("Image uploaded!");
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flower2 className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">FLEURÉA Admin</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2">
        <Button
          variant={activeTab === "flowers" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("flowers")}
        >
          <Flower2 className="w-4 h-4 mr-1" /> Flowers
        </Button>
        <Button
          variant={activeTab === "orders" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("orders")}
        >
          <Package className="w-4 h-4 mr-1" /> Orders ({orders.length})
        </Button>
      </div>

      <div className="px-6 py-4">
        {/* FLOWERS TAB */}
        {activeTab === "flowers" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground">Manage Flowers</h2>
              <Button variant="hero" size="sm" onClick={() => { setShowFlowerForm(true); setEditingFlower(null); setFlowerForm({ name: "", price_per_stem: "", mood: "romantic", description: "", image_url: "", in_stock: true }); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Flower
              </Button>
            </div>

            {/* Flower Form Modal */}
            {showFlowerForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 mb-6 border border-border"
              >
                <h3 className="font-display font-semibold mb-4">{editingFlower ? "Edit" : "Add"} Flower</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Name" value={flowerForm.name} onChange={(e) => setFlowerForm(f => ({ ...f, name: e.target.value }))} className="p-3 rounded-xl border border-border bg-card font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input placeholder="Price per stem (VNĐ)" type="number" value={flowerForm.price_per_stem} onChange={(e) => setFlowerForm(f => ({ ...f, price_per_stem: e.target.value }))} className="p-3 rounded-xl border border-border bg-card font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <select value={flowerForm.mood} onChange={(e) => setFlowerForm(f => ({ ...f, mood: e.target.value as FlowerMood }))} className="p-3 rounded-xl border border-border bg-card font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={flowerForm.in_stock} onChange={(e) => setFlowerForm(f => ({ ...f, in_stock: e.target.checked }))} className="w-4 h-4" />
                    <span className="font-body text-sm">In Stock</span>
                  </div>
                  <textarea placeholder="Description" value={flowerForm.description} onChange={(e) => setFlowerForm(f => ({ ...f, description: e.target.value }))} className="p-3 rounded-xl border border-border bg-card font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary md:col-span-2" rows={2} />
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/40 cursor-pointer hover:bg-secondary transition-colors">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <span className="font-body text-sm text-muted-foreground">Upload Image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {flowerForm.image_url && <img src={flowerForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-lg mt-2" />}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="hero" size="sm" onClick={handleSaveFlower}>Save</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setShowFlowerForm(false); setEditingFlower(null); }}>Cancel</Button>
                </div>
              </motion.div>
            )}

            {/* Flowers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flowers.map((flower) => (
                <motion.div
                  key={flower.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {flower.image_url && (
                    <div className="h-40 overflow-hidden">
                      <img src={flower.image_url} alt={flower.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-display font-semibold text-foreground">{flower.name}</h4>
                        <p className="text-sm text-muted-foreground font-body capitalize">{flower.mood}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-body ${flower.in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {flower.in_stock ? "In Stock" : "Out"}
                      </span>
                    </div>
                    <p className="text-sm font-body text-gold font-semibold mb-2">{flower.price_per_stem.toLocaleString()} VNĐ/stem</p>
                    {flower.description && <p className="text-xs text-muted-foreground font-body line-clamp-2">{flower.description}</p>}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleEditFlower(flower)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteFlower(flower.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {flowers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-body">
                <Flower2 className="w-12 h-12 mx-auto mb-4 text-border" />
                <p>No flowers yet. Add your first flower!</p>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Orders</h2>
            
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-6 mb-6 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Order Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>Close</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedOrder.generated_image_url && (
                    <div className="aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={selectedOrder.generated_image_url} alt="Bouquet" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="text-sm font-body space-y-2">
                      <p><span className="text-muted-foreground">Mood:</span> <span className="font-medium capitalize">{selectedOrder.mood}</span></p>
                      <p><span className="text-muted-foreground">Recipient:</span> <span className="font-medium capitalize">{selectedOrder.recipient_type}</span></p>
                      <p><span className="text-muted-foreground">Budget:</span> <span className="font-medium">{selectedOrder.budget.toLocaleString()} VNĐ</span></p>
                      <p><span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize">{selectedOrder.status}</span></p>
                      {selectedOrder.user_description && (
                        <p><span className="text-muted-foreground">Note:</span> <span className="font-medium">{selectedOrder.user_description}</span></p>
                      )}
                    </div>

                    {selectedOrder.ingredients && (
                      <div>
                        <p className="text-sm font-body font-medium text-foreground mb-1">Ingredients:</p>
                        <ul className="space-y-1">
                          {selectedOrder.ingredients.map((ing, i) => (
                            <li key={i} className="text-xs font-body text-muted-foreground">• {ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col items-center pt-4 border-t border-border">
                      <QRCodeSVG
                        value={`${window.location.origin}/bouquet/${selectedOrder.id}`}
                        size={120}
                        bgColor="transparent"
                        fgColor="hsl(340, 10%, 15%)"
                      />
                      <p className="text-xs text-muted-foreground font-body mt-2">Bill QR</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center gap-4">
                    {order.generated_image_url && (
                      <img src={order.generated_image_url} alt="Bouquet" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-body font-medium text-foreground capitalize">{order.mood} • {order.recipient_type}</p>
                      <p className="text-sm text-muted-foreground font-body">{order.budget.toLocaleString()} VNĐ • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-body ${order.status === "pending" ? "bg-secondary text-secondary-foreground" : "bg-green-100 text-green-700"}`}>
                      {order.status}
                    </span>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-body">
                <Package className="w-12 h-12 mx-auto mb-4 text-border" />
                <p>No orders yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
