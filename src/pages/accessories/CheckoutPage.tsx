import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AccessoriesHeader from "@/components/accessories/AccessoriesHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { formatCurrency } from "@/lib/formatters";
import { useAccessoryCart } from "@/hooks/useAccessoryCart";
import { toast } from "sonner";

const CheckoutPage = () => {
  const { items, totals, clear } = useAccessoryCart();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState("cod");
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", address_line1: "", address_line2: "",
    city: "", state: "", pincode: "", notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(cleanPhone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    const cleanPin = form.pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    if (!form.full_name.trim() || !form.address_line1.trim() || !form.city.trim()) {
      toast.error("Please fill all required address fields");
      return;
    }
    setSaving(true);
    try {
      const { data: order, error } = await supabase
        .from("accessory_orders")
        .insert({
          full_name: form.full_name.trim(),
          phone: cleanPhone,
          email: form.email.trim() || null,
          address_line1: form.address_line1.trim(),
          address_line2: form.address_line2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim() || null,
          pincode: cleanPin,
          notes: form.notes.trim() || null,
          payment_method: payment,
          subtotal: totals.subtotal,
          shipping_fee: totals.shipping,
          total: totals.total,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;
      if (!order?.id) throw new Error("Order could not be created. Please try again.");

      const { error: itemsError } = await supabase.from("accessory_order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          product_slug: i.slug,
          image_url: i.image,
          unit_price: i.price,
          mrp: i.mrp,
          quantity: i.qty,
          line_total: i.price * i.qty,
        }))
      );
      if (itemsError) throw itemsError;

      clear();
      navigate(`/accessories/order-success?order=${encodeURIComponent(order.order_number)}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not place the order. Please try again or call 6380715292.");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AccessoriesHeader />
        <div className="container mx-auto px-4 py-20 flex-1">
          <Card><CardContent className="py-20 text-center space-y-4">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/accessories"><Button>Browse accessories</Button></Link>
          </CardContent></Card>
        </div>
        <MarketplaceFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AccessoriesHeader />
      <form onSubmit={submit} className="container mx-auto px-4 py-8 flex-1 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Checkout</h1>

          <Card><CardContent className="p-5 space-y-4">
            <h2 className="font-semibold">Contact details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Full name *</Label>
                <Input id="name" required value={form.full_name} onChange={set("full_name")} /></div>
              <div><Label htmlFor="phone">Phone *</Label>
                <Input id="phone" required inputMode="tel" value={form.phone} onChange={set("phone")} /></div>
              <div className="sm:col-span-2"><Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} /></div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-4">
            <h2 className="font-semibold">Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label htmlFor="a1">Address line 1 *</Label>
                <Input id="a1" required value={form.address_line1} onChange={set("address_line1")} /></div>
              <div className="sm:col-span-2"><Label htmlFor="a2">Address line 2</Label>
                <Input id="a2" value={form.address_line2} onChange={set("address_line2")} /></div>
              <div><Label htmlFor="city">City / District *</Label>
                <Input id="city" required value={form.city} onChange={set("city")} /></div>
              <div><Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={set("state")} /></div>
              <div><Label htmlFor="pin">Pincode *</Label>
                <Input id="pin" required inputMode="numeric" maxLength={6} value={form.pincode} onChange={set("pincode")} /></div>
            </div>
            <div><Label htmlFor="notes">Delivery notes</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={set("notes")} /></div>
          </CardContent></Card>

          <Card><CardContent className="p-5 space-y-3">
            <h2 className="font-semibold">Payment method</h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="cod" id="cod" />
                <Banknote className="h-4 w-4 text-primary" />
                <div><p className="text-sm font-medium">Cash on delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when your order arrives</p></div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="upi_on_call" id="upi" />
                <Smartphone className="h-4 w-4 text-primary" />
                <div><p className="text-sm font-medium">UPI / bank transfer</p>
                  <p className="text-xs text-muted-foreground">Our team shares payment details on call</p></div>
              </label>
            </RadioGroup>
          </CardContent></Card>
        </div>

        <Card className="lg:sticky lg:top-20">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold">Order summary</h2>
            <div className="space-y-2 max-h-64 overflow-auto">
              {items.map((i) => (
                <div key={i.id} className="flex gap-2 text-sm">
                  <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                    {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <span className="flex-1 line-clamp-2">{i.name} × {i.qty}</span>
                  <span className="font-medium">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span>
              <span>{totals.shipping === 0 ? "FREE" : formatCurrency(totals.shipping)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
            <Button type="submit" size="lg" className="w-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Place order
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              By placing this order you agree to our terms. Need help? Call 6380715292.
            </p>
          </CardContent>
        </Card>
      </form>
      <MarketplaceFooter />
    </div>
  );
};

export default CheckoutPage;
