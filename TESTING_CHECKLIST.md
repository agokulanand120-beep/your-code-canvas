# UpcurvHub — App Testing & QC Checklist

Test account: `dealer1@gmail.com` / `dealer123` (seeded with 15 records each in vehicles, customers, leads, vendors, purchases, sales, payments, expenses).

## 1. Authentication
- [ ] Sign up new dealer → auto-creates `settings` + `user_roles` row
- [ ] Sign in / sign out / forgot password
- [ ] Protected routes redirect to `/auth` when logged out
- [ ] Marketplace admin redirected to `/admin/marketplace`

## 2. Dashboard (`/dashboard`)
- [ ] Stats cards: Total Vehicles, In Stock, Sold, Revenue, Profit, Pending Payments
- [ ] Inventory value chart (in_stock / sold / reserved)
- [ ] Sales funnel (leads → qualified → won/lost)
- [ ] Cash flow trend (6 months)
- [ ] Upcoming follow-ups, recent leads, test drives, outstanding payments
- [ ] No console errors (RPC `dashboard_summary` returns full payload)

## 3. Vehicles (`/vehicles`)
- [ ] List view + grid view, search, filter by status
- [ ] Add / edit / delete vehicle
- [ ] Upload images to `vehicle-images` bucket
- [ ] Toggle `is_public`, set marketplace status
- [ ] Vehicle inspection checklist (`/vehicle-inspection`)

## 4. Customers / Vendors / Leads
- [ ] CRUD for each
- [ ] Lead → Customer / Vendor conversion
- [ ] Lead status (new → qualified → won/lost) updates dashboard funnel
- [ ] Follow-up date appears on dashboard

## 5. Purchases (`/purchases`)
- [ ] Create purchase linked to vehicle + vendor
- [ ] Balance computed; payment mode set
- [ ] Vendor outstanding reflects in payments

## 6. Sales (`/sales`)
- [ ] Create sale linked to vehicle + customer
- [ ] Down payment, balance, EMI toggle, tenure, interest
- [ ] On `completed` → vehicle status = sold, dashboard revenue updates
- [ ] EMI sale generates `emi_schedules` rows

## 7. Payments (`/payments`)
- [ ] Customer payment / vendor payment / EMI payment
- [ ] Reduces sale balance / vendor outstanding
- [ ] Monthly collections visible on dashboard

## 8. Expenses (`/expenses`)
- [ ] Add expense (general / vehicle-linked)
- [ ] Categories, payment mode, totals on dashboard

## 9. EMI (`/emi`)
- [ ] Schedule list per sale, due/overdue badges
- [ ] Mark EMI paid → creates payment, updates schedule
- [ ] Pending EMIs counted on dashboard

## 10. Documents (`/documents`)
- [ ] Upload to `documents` bucket (private RLS)
- [ ] Filter by reference type, expiry tracking
- [ ] EMI documents to `emi-documents` bucket

## 11. Services (`/services`)
- [ ] Service packages CRUD
- [ ] Service records linked to vehicle/customer

## 12. Marketplace
- [ ] `/marketplace` public list of marketplace-enabled dealers/vehicles
- [ ] `/marketplace-hub` dealer marketplace dashboard
- [ ] Public vehicle page (`/v/:id`) — view counts logged to `public_page_events`
- [ ] Dealer public page (`/d/:slug`) — events logged with `user_id`
- [ ] Enquiry form creates lead with source = website

## 13. Analytics
- [ ] `/marketplace-analytics` views/enquiries per vehicle
- [ ] `/public-page-analytics` catalogue traffic

## 14. Admin (`/admin/marketplace`)
- [ ] Only `marketplace_admins` users can access
- [ ] Approve/reject dealers, badges, support tickets

## 15. Settings (`/settings`)
- [ ] Dealer profile, logo upload to `shop-logos`
- [ ] Public page slug, marketplace toggle
- [ ] SMTP test (send-email edge function)

## 16. Reports (`/reports`)
- [ ] Revenue / profit / inventory / lead source reports
- [ ] CSV / PDF export

## 17. Misc
- [ ] Calendar (`/calendar`) — follow-ups, EMIs, test drives
- [ ] Alerts (`/alerts`) — expiring docs, overdue EMIs
- [ ] Sticky notes
- [ ] Global search
- [ ] Mobile responsive (sidebar collapse)

## 18. Cross-module integration
- [ ] Lead → Sale → Payment → EMI flow
- [ ] Vehicle status auto-updates: in_stock → reserved → sold
- [ ] Vendor balance reduces on vendor payment
- [ ] Customer balance reduces on customer payment
- [ ] All amounts honor `settings.currency` and `tax_rate`

## 19. Security
- [ ] RLS: user A cannot see user B's vehicles/customers/sales
- [ ] Public pages only expose `is_public = true` data
- [ ] Storage buckets enforce per-user folder policy
- [ ] Roles via `user_roles` + `has_role()`, never client-side flags

## 20. Edge functions
- [ ] `send-email` via Gmail SMTP (587 STARTTLS)
- [ ] Logs visible in Supabase dashboard

## Known seed data (dealer1)
15 each: vehicles (VEH0001-15), customers, leads, vendors, purchases, sales, payments, expenses.
Vehicle statuses: 1-8 in_stock, 9-12 sold, 13-15 reserved.
Sales: 1-10 completed, 11-15 pending.
