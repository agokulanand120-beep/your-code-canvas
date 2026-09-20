-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'dealer', 'viewer');
CREATE TYPE public.document_type AS ENUM ('rc', 'insurance', 'puc', 'fitness', 'permit', 'road_tax', 'invoice', 'agreement', 'id_proof', 'address_proof', 'emi_document', 'other');
CREATE TYPE public.document_status AS ENUM ('active', 'expired', 'expiring_soon', 'pending');
CREATE TYPE public.payment_mode AS ENUM ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'finance', 'other');
CREATE TYPE public.emi_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'waived');

-- =========================================================
-- updated_at trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- USER ROLES (separate table, security definer for checks)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- MARKETPLACE ADMINS
-- =========================================================
CREATE TABLE public.marketplace_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_marketplace_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.marketplace_admins WHERE user_id = _user_id);
$$;

CREATE POLICY "Anyone authenticated can read marketplace admins" ON public.marketplace_admins
  FOR SELECT USING (true);
CREATE POLICY "Marketplace admins can insert admins" ON public.marketplace_admins
  FOR INSERT WITH CHECK (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Marketplace admins can delete admins" ON public.marketplace_admins
  FOR DELETE USING (public.is_marketplace_admin(auth.uid()));

-- =========================================================
-- SETTINGS (dealer profile)
-- =========================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_name TEXT,
  dealer_address TEXT,
  dealer_phone TEXT,
  dealer_email TEXT,
  dealer_gst TEXT,
  whatsapp_number TEXT,
  shop_logo_url TEXT,
  sale_prefix TEXT DEFAULT 'SALE',
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  public_page_id TEXT UNIQUE,
  public_page_theme TEXT DEFAULT 'modern',
  catalogue_template TEXT DEFAULT 'classic',
  show_vehicle_page_views BOOLEAN DEFAULT true,
  show_vehicle_page_enquiries BOOLEAN DEFAULT true,
  enable_auto_lead_popup BOOLEAN DEFAULT false,
  marketplace_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read marketplace-enabled dealers" ON public.settings
  FOR SELECT USING (marketplace_enabled = true OR public_page_id IS NOT NULL);

CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VENDORS
-- =========================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  gst_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  vendor_type TEXT DEFAULT 'individual',
  converted_from_lead BOOLEAN DEFAULT false,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vendors" ON public.vendors
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LEADS
-- =========================================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  vehicle_interest TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  lead_type TEXT DEFAULT 'buying',
  assigned_to UUID,
  follow_up_date TIMESTAMPTZ,
  last_contact_date TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  notes TEXT,
  converted_from_lead BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create leads (public enquiries)" ON public.leads
  FOR INSERT WITH CHECK (true);
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- CUSTOMERS
-- =========================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  driving_license_number TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  converted_from_lead BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VEHICLES
-- =========================================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  color TEXT,
  vehicle_type TEXT DEFAULT 'car',
  condition TEXT DEFAULT 'used',
  fuel_type TEXT,
  transmission TEXT,
  status TEXT NOT NULL DEFAULT 'in_stock',
  purchase_price NUMERIC,
  selling_price NUMERIC,
  strikeout_price NUMERIC,
  manufacturing_year INTEGER,
  registration_number TEXT,
  registration_year INTEGER,
  odometer_reading INTEGER,
  mileage NUMERIC,
  seating_capacity INTEGER,
  boot_space INTEGER,
  engine_number TEXT,
  chassis_number TEXT,
  notes TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  public_page_id TEXT,
  public_description TEXT,
  public_highlights TEXT[],
  public_features TEXT[],
  marketplace_status TEXT DEFAULT 'unlisted',
  purchase_status TEXT DEFAULT 'completed',
  image_badge_text TEXT,
  image_badge_color TEXT,
  tyre_condition TEXT,
  battery_health TEXT,
  service_history TEXT,
  hypothecation TEXT,
  number_of_owners INTEGER,
  insurance_expiry DATE,
  puc_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  road_tax_expiry DATE,
  last_service_date DATE,
  next_service_due DATE,
  show_engine_number BOOLEAN DEFAULT false,
  show_chassis_number BOOLEAN DEFAULT false,
  purchase_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vehicles" ON public.vehicles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read public vehicles" ON public.vehicles
  FOR SELECT USING (is_public = true);
CREATE POLICY "Marketplace admins can update any vehicle" ON public.vehicles
  FOR UPDATE USING (public.is_marketplace_admin(auth.uid()));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_is_public ON public.vehicles(is_public) WHERE is_public = true;

-- =========================================================
-- VEHICLE IMAGES
-- =========================================================
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vehicle images" ON public.vehicle_images
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read images of public vehicles" ON public.vehicle_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.is_public = true)
  );
CREATE INDEX idx_vehicle_images_vehicle ON public.vehicle_images(vehicle_id);

-- =========================================================
-- VEHICLE PURCHASES
-- =========================================================
CREATE TABLE public.vehicle_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_number TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode public.payment_mode DEFAULT 'cash',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own purchases" ON public.vehicle_purchases
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.vehicle_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VEHICLE INSPECTIONS
-- =========================================================
CREATE TABLE public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  checklist JSONB,
  exterior_score INTEGER DEFAULT 70,
  interior_score INTEGER DEFAULT 70,
  mechanical_score INTEGER DEFAULT 70,
  electrical_score INTEGER DEFAULT 70,
  tyres_score INTEGER DEFAULT 70,
  overall_score INTEGER,
  notes TEXT,
  is_certified BOOLEAN DEFAULT false,
  inspection_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own inspections" ON public.vehicle_inspections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read inspections of public vehicles" ON public.vehicle_inspections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.is_public = true)
  );
CREATE TRIGGER trg_inspections_updated BEFORE UPDATE ON public.vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SALES
-- =========================================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_number TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  down_payment NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  balance_amount NUMERIC DEFAULT 0,
  payment_mode public.payment_mode DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending',
  is_emi BOOLEAN DEFAULT false,
  emi_configured BOOLEAN DEFAULT false,
  annual_interest_rate NUMERIC,
  emi_tenure_months INTEGER,
  notes TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sales" ON public.sales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- EMI SCHEDULES
-- =========================================================
CREATE TABLE public.emi_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  emi_number INTEGER NOT NULL,
  emi_amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  principal_component NUMERIC DEFAULT 0,
  interest_component NUMERIC DEFAULT 0,
  principal_paid NUMERIC DEFAULT 0,
  interest_paid NUMERIC DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  status public.emi_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emi_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own EMIs" ON public.emi_schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_emi_updated BEFORE UPDATE ON public.emi_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- EMI DOCUMENTS
-- =========================================================
CREATE TABLE public.emi_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL DEFAULT 'emi-documents',
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,
  document_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emi_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own EMI docs" ON public.emi_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE,
  payment_purpose TEXT,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  principal_amount NUMERIC DEFAULT 0,
  interest_amount NUMERIC DEFAULT 0,
  profit_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payments" ON public.payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- EXPENSES
-- =========================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_number TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type public.document_type NOT NULL,
  document_url TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'active',
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SERVICE PACKAGES & RECORDS
-- =========================================================
CREATE TABLE public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  services_included TEXT[] DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_hours NUMERIC DEFAULT 1,
  vehicle_types TEXT[] DEFAULT ARRAY['car'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own packages" ON public.service_packages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.service_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_number TEXT NOT NULL,
  vehicle_number TEXT,
  vehicle_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  service_type TEXT,
  package_id UUID REFERENCES public.service_packages(id) ON DELETE SET NULL,
  services_done TEXT[] DEFAULT '{}',
  service_date DATE DEFAULT CURRENT_DATE,
  next_service_date DATE,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own service records" ON public.service_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_service_records_updated BEFORE UPDATE ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- STICKY NOTES
-- =========================================================
CREATE TABLE public.sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Note',
  content TEXT DEFAULT '',
  color TEXT DEFAULT 'bg-yellow-200',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.sticky_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sticky_updated BEFORE UPDATE ON public.sticky_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- DEALER TESTIMONIALS
-- =========================================================
CREATE TABLE public.dealer_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dealer_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read testimonials" ON public.dealer_testimonials
  FOR SELECT USING (true);
CREATE POLICY "Anyone can submit testimonials" ON public.dealer_testimonials
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Dealers manage own testimonials" ON public.dealer_testimonials
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Dealers delete own testimonials" ON public.dealer_testimonials
  FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.dealer_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PUBLIC PAGE EVENTS (analytics)
-- =========================================================
CREATE TABLE public.public_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  public_page_id TEXT,
  event_type TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.public_page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON public.public_page_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Dealers read own events" ON public.public_page_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_ppe_user ON public.public_page_events(user_id);
CREATE INDEX idx_ppe_vehicle ON public.public_page_events(vehicle_id);

-- =========================================================
-- SUPPORT TICKETS
-- =========================================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Marketplace admins read tickets" ON public.support_tickets
  FOR SELECT USING (public.is_marketplace_admin(auth.uid()));
CREATE POLICY "Marketplace admins update tickets" ON public.support_tickets
  FOR UPDATE USING (public.is_marketplace_admin(auth.uid()));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- MARKETPLACE SETTINGS (global key/value)
-- =========================================================
CREATE TABLE public.marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read marketplace settings" ON public.marketplace_settings
  FOR SELECT USING (true);
CREATE POLICY "Marketplace admins manage settings" ON public.marketplace_settings
  FOR ALL USING (public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.is_marketplace_admin(auth.uid()));
CREATE TRIGGER trg_mp_settings_updated BEFORE UPDATE ON public.marketplace_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- MARKETPLACE MODERATION LOG
-- =========================================================
CREATE TABLE public.marketplace_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID,
  action TEXT NOT NULL,
  badge_value TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace admins manage moderation" ON public.marketplace_moderation
  FOR ALL USING (public.is_marketplace_admin(auth.uid()))
  WITH CHECK (public.is_marketplace_admin(auth.uid()));

-- =========================================================
-- AUTO-CREATE viewer role + empty settings on user signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dealer')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
