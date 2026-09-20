import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, subMonths, subDays, isAfter } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import {
  IndianRupee, TrendingUp, Car, Package, DollarSign, AlertTriangle,
  Wallet, Receipt, CalendarIcon, HandCoins, Users, UserPlus, Building2,
} from "lucide-react";
import { formatIndianNumber } from "@/lib/formatters";
import { AnalyticsSkeleton } from "@/components/ui/page-skeleton";

// ─── Palette ─────────────────────────────────────────────────────────
const PALETTE = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(339, 90%, 51%)",
  "hsl(199, 89%, 48%)",
  "hsl(25, 95%, 53%)",
  "hsl(173, 80%, 40%)",
];

const fmt = (n: number) => "₹" + formatIndianNumber(Math.round(n || 0));

type PresetPeriod = "today" | "week" | "month" | "year" | "custom";

// ─── Data hook ───────────────────────────────────────────────────────
function useReportData(userId: string | undefined, from: Date, to: Date) {
  return useQuery({
    queryKey: ["reports-v2", userId, from.toISOString(), to.toISOString()],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const fromIso = startOfDay(from).toISOString();
      const toIso = endOfDay(to).toISOString();

      const [salesR, vehiclesR, expensesR, paymentsR, leadsR, purchasesR, customersR, vendorsR, emiR] =
        await Promise.all([
          supabase.from("sales")
            .select("id, sale_date, total_amount, selling_price, discount, tax_amount, payment_mode, status, vehicle_id, customer_id, additional_charges, balance_amount, created_at")
            .eq("user_id", userId!)
            .gte("sale_date", format(from, "yyyy-MM-dd"))
            .lte("sale_date", format(to, "yyyy-MM-dd")),
          supabase.from("vehicles")
            .select("id, brand, model, status, purchase_price, selling_price, created_at")
            .eq("user_id", userId!),
          supabase.from("expenses")
            .select("id, amount, category, expense_date")
            .eq("user_id", userId!)
            .gte("expense_date", format(from, "yyyy-MM-dd"))
            .lte("expense_date", format(to, "yyyy-MM-dd")),
          supabase.from("payments")
            .select("id, amount, payment_type, payment_mode, payment_date")
            .eq("user_id", userId!)
            .gte("payment_date", format(from, "yyyy-MM-dd"))
            .lte("payment_date", format(to, "yyyy-MM-dd")),
          supabase.from("leads")
            .select("id, status, created_at")
            .eq("user_id", userId!),
          supabase.from("vehicle_purchases")
            .select("id, purchase_price, balance_amount, vendor_id, purchase_date, amount_paid")
            .eq("user_id", userId!),
          supabase.from("customers")
            .select("id, full_name")
            .eq("user_id", userId!),
          supabase.from("vendors")
            .select("id, name")
            .eq("user_id", userId!),
          supabase.from("emi_schedules")
            .select("id, status, emi_amount, due_date")
            .eq("user_id", userId!),
        ]);

      return {
        sales: salesR.data || [],
        vehicles: vehiclesR.data || [],
        expenses: expensesR.data || [],
        payments: paymentsR.data || [],
        leads: leadsR.data || [],
        purchases: purchasesR.data || [],
        customers: customersR.data || [],
        vendors: vendorsR.data || [],
        emis: emiR.data || [],
      };
    },
  });
}

// ─── KPI Card ────────────────────────────────────────────────────────
const Kpi = ({ label, value, icon: Icon, tone = "primary" }: any) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-lg lg:text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${tone}/10`}>
          <Icon className={`h-4 w-4 text-${tone}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Chart card wrapper ──────────────────────────────────────────────
const Panel = ({ title, subtitle, children }: any) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardHeader>
    <CardContent className="pt-2">{children}</CardContent>
  </Card>
);

// ─── Reports page ────────────────────────────────────────────────────
const Reports = () => {
  const { user } = useAuth();
  const [preset, setPreset] = useState<PresetPeriod>("month");
  const [customFrom, setCustomFrom] = useState<Date>(subMonths(new Date(), 1));
  const [customTo, setCustomTo] = useState<Date>(new Date());

  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "today": return { from: startOfDay(now), to: endOfDay(now) };
      case "week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
      case "month": return { from: startOfMonth(now), to: now };
      case "year": return { from: startOfYear(now), to: now };
      case "custom": return { from: customFrom, to: customTo };
    }
  }, [preset, customFrom, customTo]);

  const { data, isLoading } = useReportData(user?.id, from, to);

  // ─── Derived metrics ───────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!data) return null;
    const { sales, vehicles, expenses, payments, leads, purchases, customers, vendors, emis } = data;

    const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalCost = sales.reduce((sum, s) => {
      const veh = vehicles.find(v => v.id === s.vehicle_id);
      return sum + (veh?.purchase_price || 0);
    }, 0);
    const grossProfit = totalRevenue - totalCost;

    const vehiclesSold = vehicles.filter(v => v.status === "sold").length;
    const availableStock = vehicles.filter(v => v.status === "in_stock").length;
    const reserved = vehicles.filter(v => v.status === "reserved").length;

    const today = new Date();
    const todaySales = sales.filter(s => {
      const d = new Date(s.sale_date);
      return d >= startOfDay(today) && d <= endOfDay(today);
    }).reduce((sum, s) => sum + (s.total_amount || 0), 0);

    const pendingEmi = emis
      .filter(e => e.status && ["pending", "overdue", "partial", "partially_paid"].includes(e.status))
      .reduce((sum, e) => sum + (Number(e.emi_amount) || 0), 0);

    const outstandingVendor = purchases.reduce((sum, p) => sum + (Number(p.balance_amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const customerReceivable = sales.reduce((sum, s) => sum + (Number(s.balance_amount) || 0), 0);
    const totalCustomers = customers.length;
    const totalLeads = leads.length;
    const totalVendors = vendors.length;

    // Revenue vs Expenses (monthly, last 6 months)
    const buckets: Record<string, { month: string; revenue: number; expenses: number; sales: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM");
      buckets[key] = { month: key, revenue: 0, expenses: 0, sales: 0 };
    }
    sales.forEach(s => {
      const key = format(new Date(s.sale_date), "MMM");
      if (buckets[key]) { buckets[key].revenue += s.total_amount || 0; buckets[key].sales++; }
    });
    expenses.forEach(e => {
      const key = format(new Date(e.expense_date), "MMM");
      if (buckets[key]) buckets[key].expenses += Number(e.amount) || 0;
    });
    const trend = Object.values(buckets);

    // Inventory pie
    const inventory = [
      { name: "Available", value: availableStock },
      { name: "Reserved", value: reserved },
      { name: "Sold", value: vehiclesSold },
    ].filter(i => i.value > 0);

    // Lead funnel
    const leadCount = (statuses: string[]) => leads.filter(l => statuses.includes(l.status)).length;
    const funnel = [
      { stage: "Leads", count: leads.length },
      { stage: "Interested", count: leadCount(["contacted", "qualified", "test_drive"]) },
      { stage: "Negotiation", count: leadCount(["negotiation"]) },
      { stage: "Won", count: leadCount(["won", "converted"]) },
    ];

    // Top brands
    const brandTotals: Record<string, number> = {};
    sales.forEach(s => {
      const v = vehicles.find(x => x.id === s.vehicle_id);
      if (!v) return;
      brandTotals[v.brand] = (brandTotals[v.brand] || 0) + (s.total_amount || 0);
    });
    const topBrands = Object.entries(brandTotals)
      .map(([brand, value]) => ({ brand, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Payment mode pie
    const modes: Record<string, number> = {};
    sales.forEach(s => {
      const m = (s.payment_mode || "other").toString();
      modes[m] = (modes[m] || 0) + (s.total_amount || 0);
    });
    const paymentModes = Object.entries(modes).map(([name, value]) => ({ name, value }));

    // Cash flow line (monthly)
    const cash: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const key = format(subMonths(new Date(), i), "MMM");
      cash[key] = { month: key, income: 0, expense: 0 };
    }
    payments.forEach(p => {
      const key = format(new Date(p.payment_date), "MMM");
      if (!cash[key]) return;
      if (["customer_payment", "received", "sale", "emi"].includes(p.payment_type)) cash[key].income += p.amount || 0;
      else cash[key].expense += p.amount || 0;
    });
    const cashFlow = Object.values(cash);

    // Expense categories
    const cat: Record<string, number> = {};
    expenses.forEach(e => { cat[e.category] = (cat[e.category] || 0) + (Number(e.amount) || 0); });
    const expenseCats = Object.entries(cat).map(([name, value]) => ({ name, value }));

    // Top customers
    const custTotals: Record<string, number> = {};
    sales.forEach(s => {
      if (!s.customer_id) return;
      custTotals[s.customer_id] = (custTotals[s.customer_id] || 0) + (s.total_amount || 0);
    });
    const topCustomers = Object.entries(custTotals)
      .map(([id, value]) => ({ name: customers.find(c => c.id === id)?.full_name || "Unknown", value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top vendors (by purchase value)
    const vendorTotals: Record<string, number> = {};
    purchases.forEach(p => {
      if (!p.vendor_id) return;
      vendorTotals[p.vendor_id] = (vendorTotals[p.vendor_id] || 0) + (Number(p.purchase_price) || 0);
    });
    const topVendors = Object.entries(vendorTotals)
      .map(([id, value]) => ({ name: vendors.find(v => v.id === id)?.name || "Unknown", value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Insights
    const insights: string[] = [];
    if (trend.length >= 2) {
      const prev = trend[trend.length - 2].revenue;
      const curr = trend[trend.length - 1].revenue;
      if (prev > 0) {
        const chg = ((curr - prev) / prev) * 100;
        if (Math.abs(chg) > 1)
          insights.push(`Revenue ${chg > 0 ? "increased" : "decreased"} by ${Math.abs(chg).toFixed(1)}% vs last month.`);
      }
    }
    if (topBrands.length && totalRevenue > 0) {
      const top = topBrands[0];
      insights.push(`${top.brand} contributes ${((top.value / totalRevenue) * 100).toFixed(0)}% of total sales.`);
    }
    const financeSales = (modes["finance"] || 0) + (modes["emi"] || 0);
    if (financeSales > 0 && totalRevenue > 0)
      insights.push(`Finance / EMI accounts for ${((financeSales / totalRevenue) * 100).toFixed(0)}% of sales.`);
    const overdueEmi = emis.filter(e => e.status === "overdue").length;
    if (overdueEmi > 0) insights.push(`${overdueEmi} EMI payment${overdueEmi > 1 ? "s are" : " is"} overdue.`);
    const idleThreshold = subDays(new Date(), 90);
    const idleValue = vehicles
      .filter(v => v.status === "in_stock" && !isAfter(new Date(v.created_at), idleThreshold))
      .reduce((sum, v) => sum + (v.selling_price || 0), 0);
    if (idleValue > 0) insights.push(`Stock worth ${fmt(idleValue)} has been idle for over 90 days.`);

    return {
      totalRevenue, grossProfit, vehiclesSold, availableStock, todaySales,
      pendingEmi, outstandingVendor, totalExpenses,
      customerReceivable, totalCustomers, totalLeads, totalVendors,
      trend, inventory, funnel, topBrands, paymentModes, cashFlow, expenseCats,
      topCustomers, topVendors, insights,
    };
  }, [data]);

  if (isLoading || !metrics) return <AnalyticsSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {format(from, "dd MMM yyyy")} – {format(to, "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["year", "This Year"],
          ] as [PresetPeriod, string][]).map(([k, label]) => (
            <Button
              key={k}
              size="sm"
              variant={preset === k ? "default" : "outline"}
              onClick={() => setPreset(k)}
            >{label}</Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant={preset === "custom" ? "default" : "outline"} className="gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-3 space-y-2">
              <div className="flex gap-2">
                <div>
                  <p className="text-xs mb-1 text-muted-foreground">From</p>
                  <Calendar mode="single" selected={customFrom} onSelect={(d) => d && setCustomFrom(d)} />
                </div>
                <div>
                  <p className="text-xs mb-1 text-muted-foreground">To</p>
                  <Calendar mode="single" selected={customTo} onSelect={(d) => d && setCustomTo(d)} />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={() => setPreset("custom")}>Apply</Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 1: 8 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Customer Payable" value={fmt(metrics.customerReceivable)} icon={HandCoins} tone="chart-5" />
        <Kpi label="Total Customers" value={metrics.totalCustomers} icon={Users} tone="chart-1" />
        <Kpi label="Total Leads" value={metrics.totalLeads} icon={UserPlus} tone="chart-2" />
        <Kpi label="Total Vendors" value={metrics.totalVendors} icon={Building2} tone="chart-4" />
        <Kpi label="Total Revenue" value={fmt(metrics.totalRevenue)} icon={IndianRupee} tone="primary" />
        <Kpi label="Gross Profit" value={fmt(metrics.grossProfit)} icon={TrendingUp} tone="chart-2" />
        <Kpi label="Vehicles Sold" value={metrics.vehiclesSold} icon={Car} tone="chart-1" />
        <Kpi label="Available Stock" value={metrics.availableStock} icon={Package} tone="chart-3" />
        <Kpi label="Today's Sales" value={fmt(metrics.todaySales)} icon={DollarSign} tone="chart-4" />
        <Kpi label="Pending EMI" value={fmt(metrics.pendingEmi)} icon={AlertTriangle} tone="chart-5" />
        <Kpi label="Vendor Payable" value={fmt(metrics.outstandingVendor)} icon={Wallet} tone="chart-3" />
        <Kpi label="Total Expenses" value={fmt(metrics.totalExpenses)} icon={Receipt} tone="destructive" />
      </div>

      {/* Row 2: Revenue vs Expenses + Sales by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Revenue vs Expenses" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={metrics.trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke={PALETTE[0]} fill={PALETTE[0]} fillOpacity={0.3} />
              <Area type="monotone" dataKey="expenses" stroke={PALETTE[4]} fill={PALETTE[4]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Sales by Month" subtitle="Vehicles sold per month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={metrics.trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sales" fill={PALETTE[1]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 3: Inventory + Lead Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Inventory Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={metrics.inventory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {metrics.inventory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Lead Conversion Funnel">
          <div className="space-y-3 py-4">
            {metrics.funnel.map((f, i) => {
              const max = Math.max(...metrics.funnel.map(x => x.count), 1);
              const pct = (f.count / max) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{f.count}</span>
                  </div>
                  <div className="h-3 bg-muted rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: PALETTE[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Row 4: Top Brands + Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top Selling Brands" subtitle="By revenue">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={metrics.topBrands} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + formatIndianNumber(v)} />
              <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" fill={PALETTE[0]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Sales by Payment Mode">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={metrics.paymentModes} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => e.name}>
                {metrics.paymentModes.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 5: Cash Flow + Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Monthly Cash Flow" subtitle="Income vs Expense">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={metrics.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => "₹" + formatIndianNumber(v)} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke={PALETTE[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke={PALETTE[4]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Expense Categories">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={metrics.expenseCats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={(e) => e.name}>
                {metrics.expenseCats.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 6: Top Customers + Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top 5 Customers">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {metrics.topCustomers.map((c, i) => (
                <TableRow key={i}><TableCell>{c.name}</TableCell><TableCell className="text-right font-medium">{fmt(c.value)}</TableCell></TableRow>
              ))}
              {!metrics.topCustomers.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Panel>
        <Panel title="Top 5 Vendors">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Vendor</TableHead><TableHead className="text-right">Purchases</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {metrics.topVendors.map((v, i) => (
                <TableRow key={i}><TableCell>{v.name}</TableCell><TableCell className="text-right font-medium">{fmt(v.value)}</TableCell></TableRow>
              ))}
              {!metrics.topVendors.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Panel>
      </div>

      {/* Business Insights */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Insights</CardTitle></CardHeader>
        <CardContent>
          {metrics.insights.length ? (
            <ul className="space-y-2 text-sm">
              {metrics.insights.map((i, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span><span>{i}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No insights available for the selected period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
