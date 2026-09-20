# Dashboard & Reports Validation

Reference for the seeded demo user
**user_id: `67eec708-632c-47ab-ba5e-493296da83db`**
Populated by `seed_all_demo_data(uuid)`: 200 rows in **vendors, customers, vehicles, leads,
purchases, sales, payments, expenses** (~200 records each).

Use this document to cross-check that the Dashboard and Reports pages render
consistent numbers against the raw database.

---

## Dashboard widgets — what they show

Source: `src/pages/Dashboard.tsx` + `dashboard_summary` RPC + `src/services/api/dashboard.ts`.

### KPI cards

| Card | Formula | Source |
|---|---|---|
| Total Revenue | `SUM(sales.total_amount) WHERE status='completed'` (includes tax + additional_charges) | `dashboard_summary.total_revenue` |
| Total Profit | `total_revenue − total_cost − total_expenses` | Derived client-side |
| Vehicles In Stock | `COUNT(vehicles) WHERE status='in_stock'` | `dashboard_summary.vehicles_in_stock` |
| Vehicles Sold | `COUNT(vehicles) WHERE status='sold'` | `dashboard_summary.vehicles_sold` |
| Total Customers | `COUNT(customers)` | `dashboard_summary.total_customers` |
| Pending EMIs | `COUNT(emi_schedules) WHERE status IN (pending, partial, overdue, partially_paid)` | `dashboard_summary.pending_emis` |
| Pending Vendor Payments | `SUM(vehicle_purchases.balance_amount)` | `dashboard_summary.pending_vendor_payments` |
| Monthly Collections | `SUM(payments.amount) WHERE payment_date >= first_of_month AND type IN (customer_payment, received, sale, emi)` | `dashboard_summary.monthly_collections` |

### Panels

- **Cash Flow (6 mo)** — monthly aggregation of `payments.amount` grouped by `payment_type` (`customer_payment` → inflow, `vendor_payment` → outflow).
- **Inventory Value donut** — `SUM(selling_price)` for in-stock/reserved vehicles + `SUM(total_amount)` for completed sales.
- **Sales Funnel** — `leads` counts by status: total → qualified → won → lost.
- **Upcoming Follow-ups** — top 5 leads with `follow_up_date >= now()`.
- **Test Drives** — top 5 leads whose `notes` include `TEST DRIVE REQUESTED: YYYY-MM-DD`.
- **Top Marketplace / Catalogue Vehicle** — from `public_page_events` in last 6 months.
- **Outstanding Payments** — top 5 sales with `balance_amount > 0`.

### SQL to cross-check the seeded user

```sql
SELECT
  (SELECT count(*) FROM vehicles  WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS vehicles,
  (SELECT count(*) FROM customers WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS customers,
  (SELECT count(*) FROM vendors   WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS vendors,
  (SELECT count(*) FROM leads     WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS leads,
  (SELECT count(*) FROM sales     WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS sales,
  (SELECT count(*) FROM payments  WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS payments,
  (SELECT count(*) FROM expenses  WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS expenses,
  (SELECT count(*) FROM vehicle_purchases WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db') AS purchases;
```

Expected: each ≥ 200.

```sql
-- Dashboard KPIs
SELECT public.dashboard_summary('67eec708-632c-47ab-ba5e-493296da83db');
```

---

## Reports page — what each panel shows

Source: `src/pages/Reports.tsx` (redesigned single dashboard).
Date filter presets: **Today / This Week / This Month / This Year / Custom**.

### Row 1 — 8 KPI cards

| KPI | Formula (against filtered range) |
|---|---|
| Total Revenue | `SUM(sales.total_amount) WHERE status='completed'` |
| Gross Profit | `total_revenue − Σ(vehicle.purchase_price for each sale)` |
| Vehicles Sold | `COUNT(vehicles WHERE status='sold')` (all-time; not date-filtered) |
| Available Stock | `COUNT(vehicles WHERE status='in_stock')` |
| Today's Sales | `SUM(sales.total_amount WHERE sale_date=TODAY)` |
| Pending EMI | `SUM(emi_schedules.emi_amount WHERE status IN (pending, overdue, partial, partially_paid))` |
| Vendor Payable | `SUM(vehicle_purchases.balance_amount)` |
| Total Expenses | `SUM(expenses.amount)` |

### Rows 2–5 — Charts

| Row | Left panel | Right panel |
|---|---|---|
| 2 | Revenue vs Expenses (area, last 6 mo) | Sales by Month (bar) |
| 3 | Inventory Status (donut) | Lead Conversion Funnel |
| 4 | Top Selling Brands (horizontal bar, top 5) | Sales by Payment Mode (pie) |
| 5 | Monthly Cash Flow (line) | Expense Categories (donut) |

### Row 6 — Ranking tables

- **Top 5 Customers** — grouped `sales.customer_id`, sum of `total_amount`, joined against `customers.full_name`.
- **Top 5 Vendors** — grouped `vehicle_purchases.vendor_id`, sum of `purchase_price`, joined against `vendors.name`.

### Business Insights

Rule-based bullets:
1. Revenue change vs previous month.
2. Top brand's share of total revenue.
3. Share of Finance/EMI in sales.
4. Overdue EMI count.
5. Idle stock (>90 days) value.

### Cross-check queries

```sql
-- Total Revenue this month
SELECT SUM(total_amount) FROM sales
WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db'
  AND status = 'completed'
  AND sale_date >= date_trunc('month', now());

-- Vehicles Sold count
SELECT count(*) FROM vehicles
WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db' AND status = 'sold';

-- Top brand
SELECT v.brand, SUM(s.total_amount) AS revenue
FROM sales s JOIN vehicles v ON v.id = s.vehicle_id
WHERE s.user_id = '67eec708-632c-47ab-ba5e-493296da83db' AND s.status = 'completed'
GROUP BY v.brand ORDER BY revenue DESC LIMIT 5;

-- Sales by payment mode
SELECT payment_mode, SUM(total_amount) FROM sales
WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db' AND status = 'completed'
GROUP BY payment_mode ORDER BY 2 DESC;

-- Vendor payables
SELECT SUM(balance_amount) FROM vehicle_purchases
WHERE user_id = '67eec708-632c-47ab-ba5e-493296da83db';
```

---

## Re-seeding

To top-up more data (adds another 200 of each with unique codes), run:

```sql
SELECT public.seed_all_demo_data('67eec708-632c-47ab-ba5e-493296da83db');
```

Numbers get a fresh `tag` suffix per invocation so codes never collide.
