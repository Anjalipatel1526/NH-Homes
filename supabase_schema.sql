-- ============================================================
-- NH HOMES CIVIL EQUIPMENT RENTAL - SUPABASE SQL SCHEMA (RLS ENABLED)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ========================
-- 1. CUSTOM TYPES (ENUMS)
-- ========================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
    CREATE TYPE employee_status AS ENUM ('Active', 'Inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
    CREATE TYPE client_status AS ENUM ('Active', 'Inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_status') THEN
    CREATE TYPE inventory_status AS ENUM ('Available', 'Rented', 'Maintenance', 'Reserved', 'Lost', 'Damaged');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_status') THEN
    CREATE TYPE rental_status AS ENUM ('Pending', 'Approved', 'Rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Partial', 'Overdue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('UPI', 'Cash', 'Cheque', 'Bank Transfer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_history_status') THEN
    CREATE TYPE rental_history_status AS ENUM ('Active', 'Completed', 'Overdue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_rental_status') THEN
    CREATE TYPE client_rental_status AS ENUM ('Active', 'Completed', 'Pending', 'Overdue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_payment_status') THEN
    CREATE TYPE client_payment_status AS ENUM ('Completed', 'Partial', 'Pending');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM ('create', 'update', 'delete', 'auth', 'system', 'payment', 'rental');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_interval') THEN
    CREATE TYPE backup_interval AS ENUM ('daily', 'weekly', 'monthly');
  END IF;
END $$;


-- ========================
-- 2. PROFILES TABLE (linked to Supabase Auth)
-- ========================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  name TEXT NOT NULL,
  profile_image TEXT,
  entity_id TEXT,  -- Links to employee.id or client.id
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 3. EMPLOYEES TABLE
-- ========================

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL,
  department TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status employee_status NOT NULL DEFAULT 'Active',
  joining_date DATE NOT NULL,
  salary NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  rating NUMERIC(2,1) DEFAULT 5.0,
  tasks_completed INTEGER DEFAULT 0,
  efficiency INTEGER DEFAULT 100,
  avatar TEXT,
  profile_picture TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 4. CLIENTS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status client_status NOT NULL DEFAULT 'Active',
  outstanding_payment NUMERIC(12,2) DEFAULT 0.00,
  total_rentals INTEGER DEFAULT 0,
  address TEXT NOT NULL DEFAULT '',
  city TEXT,
  state TEXT,
  pincode TEXT,
  id_proof TEXT,
  notes TEXT,
  profile_image TEXT,
  password TEXT,
  gstin TEXT,
  pan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 5. INVENTORY ITEMS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT UNIQUE NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  rental_price_day NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  rental_price_week NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  rental_price_month NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_location TEXT NOT NULL DEFAULT 'Yard Panvel',
  images TEXT[] DEFAULT '{}',
  status inventory_status NOT NULL DEFAULT 'Available',
  qr_code TEXT UNIQUE,
  barcode TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 6. EQUIPMENT SPECIFICATIONS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS equipment_specifications (
  id BIGSERIAL PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL
);


-- ========================
-- 7. MAINTENANCE RECORDS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  description TEXT,
  technician TEXT NOT NULL
);


-- ========================
-- 8. RENTAL REQUESTS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS rental_requests (
  id TEXT PRIMARY KEY,
  rental_number TEXT,
  invoice_number TEXT,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  project_lead TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_return_date DATE,
  status rental_status NOT NULL DEFAULT 'Pending',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12,2) DEFAULT 0.00,
  security_deposit_total NUMERIC(12,2) DEFAULT 0.00,
  gst_total NUMERIC(12,2) DEFAULT 0.00,
  discount_total NUMERIC(12,2) DEFAULT 0.00,
  rental_charges_total NUMERIC(12,2) DEFAULT 0.00,
  grand_total NUMERIC(12,2) DEFAULT 0.00,
  additional_charges JSONB DEFAULT '{}',
  payment_status TEXT DEFAULT 'Pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  invoice_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 9. RENTAL REQUEST ITEMS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS rental_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_request_id TEXT REFERENCES rental_requests(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  daily_charges NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  duration_days INTEGER NOT NULL DEFAULT 1,
  discount NUMERIC(10,2) DEFAULT 0.00,
  security_deposit NUMERIC(10,2) DEFAULT 0.00,
  taxes NUMERIC(10,2) DEFAULT 0.00,
  subtotal NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) DEFAULT 0.00,
  expected_return_date DATE,
  notes TEXT
);


-- ========================
-- 10. EQUIPMENT RENTAL HISTORY TABLE
-- ========================

CREATE TABLE IF NOT EXISTS equipment_rental_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  rental_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status rental_history_status NOT NULL
);


-- ========================
-- 11. CLIENT RENTAL HISTORY TABLE
-- ========================

CREATE TABLE IF NOT EXISTS client_rental_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  rental_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status client_rental_status NOT NULL
);


-- ========================
-- 12. CLIENT PAYMENT HISTORY TABLE
-- ========================

CREATE TABLE IF NOT EXISTS client_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method payment_method NOT NULL,
  status client_payment_status NOT NULL
);


-- ========================
-- 13. ACTIVITY LOGS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  type activity_type NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 14. SYSTEM SETTINGS TABLE (Singleton pattern)
-- ========================

CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL DEFAULT '',
  company_email TEXT NOT NULL DEFAULT '',
  company_phone TEXT NOT NULL DEFAULT '',
  gstin TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  rental_rules TEXT,
  terms_conditions TEXT,
  notification_email_alerts BOOLEAN DEFAULT true,
  notification_sms_alerts BOOLEAN DEFAULT false,
  notification_return_reminders BOOLEAN DEFAULT true,
  notification_payment_reminders BOOLEAN DEFAULT true,
  backup_interval backup_interval NOT NULL DEFAULT 'daily',
  last_backup_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 15. AUTO-GENERATION TRIGGERS AND FUNCTIONS
-- ============================================================

-- A. Auto Equipment ID, Barcode, and QR Code Generator
CREATE OR REPLACE FUNCTION generate_equipment_id()
RETURNS TRIGGER AS $$
DECLARE
  cat_code TEXT;
  next_val INT;
  eq_code TEXT;
  epoch_millis BIGINT;
BEGIN
  -- Get category prefix code (e.g., 'Drilling Machines' -> 'DRI', 'Excavators' -> 'EXC')
  cat_code := UPPER(SUBSTRING(NEW.category FROM 1 FOR 3));
  
  -- If substring is shorter than 3 letters, pad it with X
  IF LENGTH(cat_code) < 3 THEN
    cat_code := RPAD(cat_code, 3, 'X');
  END IF;

  -- Get next sequence number for this category
  SELECT COALESCE(MAX(SUBSTRING(equipment_id FROM 8 FOR 3)::INTEGER), 0) + 1
  INTO next_val
  FROM inventory_items
  WHERE category = NEW.category;

  -- Format equipment id (e.g. EQ-DRI-001)
  eq_code := 'EQ-' || cat_code || '-' || LPAD(next_val::TEXT, 3, '0');
  NEW.equipment_id := eq_code;

  -- Generate barcode and qr_code using epoch millis if empty
  epoch_millis := EXTRACT(EPOCH FROM NOW()) * 1000;
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'QR_' || eq_code || '_' || epoch_millis::TEXT;
  END IF;
  
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'BAR_' || eq_code || '_' || epoch_millis::TEXT;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_equipment_id ON inventory_items;
CREATE TRIGGER trg_auto_equipment_id
BEFORE INSERT ON inventory_items
FOR EACH ROW
WHEN (NEW.equipment_id IS NULL OR NEW.equipment_id = '')
EXECUTE FUNCTION generate_equipment_id();


-- B. Auto update_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profiles_updated_at ON profiles;
CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_inventory_updated_at ON inventory_items;
CREATE TRIGGER trg_update_inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_rental_requests_updated_at ON rental_requests;
CREATE TRIGGER trg_update_rental_requests_updated_at BEFORE UPDATE ON rental_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_system_settings_updated_at ON system_settings;
CREATE TRIGGER trg_update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 16. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
--     with permissive policies so the anon key can still operate
-- ============================================================

-- Enable RLS on every table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_rental_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rental_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 17. RLS POLICIES - Allow anon role full access
--     (Since app uses anon key for all operations currently)
-- ============================================================

-- Helper: create full-access policies for a given table
-- We create SELECT, INSERT, UPDATE, DELETE policies for the anon role

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
CREATE POLICY "profiles_delete_all" ON profiles FOR DELETE TO anon USING (true);

-- EMPLOYEES
DROP POLICY IF EXISTS "employees_select_all" ON employees;
CREATE POLICY "employees_select_all" ON employees FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "employees_insert_all" ON employees;
CREATE POLICY "employees_insert_all" ON employees FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "employees_update_all" ON employees;
CREATE POLICY "employees_update_all" ON employees FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "employees_delete_all" ON employees;
CREATE POLICY "employees_delete_all" ON employees FOR DELETE TO anon USING (true);

-- CLIENTS
DROP POLICY IF EXISTS "clients_select_all" ON clients;
CREATE POLICY "clients_select_all" ON clients FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "clients_insert_all" ON clients;
CREATE POLICY "clients_insert_all" ON clients FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "clients_update_all" ON clients;
CREATE POLICY "clients_update_all" ON clients FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clients_delete_all" ON clients;
CREATE POLICY "clients_delete_all" ON clients FOR DELETE TO anon USING (true);

-- INVENTORY ITEMS
DROP POLICY IF EXISTS "inventory_items_select_all" ON inventory_items;
CREATE POLICY "inventory_items_select_all" ON inventory_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "inventory_items_insert_all" ON inventory_items;
CREATE POLICY "inventory_items_insert_all" ON inventory_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "inventory_items_update_all" ON inventory_items;
CREATE POLICY "inventory_items_update_all" ON inventory_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "inventory_items_delete_all" ON inventory_items;
CREATE POLICY "inventory_items_delete_all" ON inventory_items FOR DELETE TO anon USING (true);

-- EQUIPMENT SPECIFICATIONS
DROP POLICY IF EXISTS "equipment_specifications_select_all" ON equipment_specifications;
CREATE POLICY "equipment_specifications_select_all" ON equipment_specifications FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "equipment_specifications_insert_all" ON equipment_specifications;
CREATE POLICY "equipment_specifications_insert_all" ON equipment_specifications FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "equipment_specifications_update_all" ON equipment_specifications;
CREATE POLICY "equipment_specifications_update_all" ON equipment_specifications FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "equipment_specifications_delete_all" ON equipment_specifications;
CREATE POLICY "equipment_specifications_delete_all" ON equipment_specifications FOR DELETE TO anon USING (true);

-- MAINTENANCE RECORDS
DROP POLICY IF EXISTS "maintenance_records_select_all" ON maintenance_records;
CREATE POLICY "maintenance_records_select_all" ON maintenance_records FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "maintenance_records_insert_all" ON maintenance_records;
CREATE POLICY "maintenance_records_insert_all" ON maintenance_records FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "maintenance_records_update_all" ON maintenance_records;
CREATE POLICY "maintenance_records_update_all" ON maintenance_records FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "maintenance_records_delete_all" ON maintenance_records;
CREATE POLICY "maintenance_records_delete_all" ON maintenance_records FOR DELETE TO anon USING (true);

-- RENTAL REQUESTS
DROP POLICY IF EXISTS "rental_requests_select_all" ON rental_requests;
CREATE POLICY "rental_requests_select_all" ON rental_requests FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "rental_requests_insert_all" ON rental_requests;
CREATE POLICY "rental_requests_insert_all" ON rental_requests FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "rental_requests_update_all" ON rental_requests;
CREATE POLICY "rental_requests_update_all" ON rental_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "rental_requests_delete_all" ON rental_requests;
CREATE POLICY "rental_requests_delete_all" ON rental_requests FOR DELETE TO anon USING (true);

-- RENTAL REQUEST ITEMS
DROP POLICY IF EXISTS "rental_request_items_select_all" ON rental_request_items;
CREATE POLICY "rental_request_items_select_all" ON rental_request_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "rental_request_items_insert_all" ON rental_request_items;
CREATE POLICY "rental_request_items_insert_all" ON rental_request_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "rental_request_items_update_all" ON rental_request_items;
CREATE POLICY "rental_request_items_update_all" ON rental_request_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "rental_request_items_delete_all" ON rental_request_items;
CREATE POLICY "rental_request_items_delete_all" ON rental_request_items FOR DELETE TO anon USING (true);

-- EQUIPMENT RENTAL HISTORY
DROP POLICY IF EXISTS "equipment_rental_history_select_all" ON equipment_rental_history;
CREATE POLICY "equipment_rental_history_select_all" ON equipment_rental_history FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "equipment_rental_history_insert_all" ON equipment_rental_history;
CREATE POLICY "equipment_rental_history_insert_all" ON equipment_rental_history FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "equipment_rental_history_update_all" ON equipment_rental_history;
CREATE POLICY "equipment_rental_history_update_all" ON equipment_rental_history FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "equipment_rental_history_delete_all" ON equipment_rental_history;
CREATE POLICY "equipment_rental_history_delete_all" ON equipment_rental_history FOR DELETE TO anon USING (true);

-- CLIENT RENTAL HISTORY
DROP POLICY IF EXISTS "client_rental_history_select_all" ON client_rental_history;
CREATE POLICY "client_rental_history_select_all" ON client_rental_history FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "client_rental_history_insert_all" ON client_rental_history;
CREATE POLICY "client_rental_history_insert_all" ON client_rental_history FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "client_rental_history_update_all" ON client_rental_history;
CREATE POLICY "client_rental_history_update_all" ON client_rental_history FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "client_rental_history_delete_all" ON client_rental_history;
CREATE POLICY "client_rental_history_delete_all" ON client_rental_history FOR DELETE TO anon USING (true);

-- CLIENT PAYMENT HISTORY
DROP POLICY IF EXISTS "client_payment_history_select_all" ON client_payment_history;
CREATE POLICY "client_payment_history_select_all" ON client_payment_history FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "client_payment_history_insert_all" ON client_payment_history;
CREATE POLICY "client_payment_history_insert_all" ON client_payment_history FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "client_payment_history_update_all" ON client_payment_history;
CREATE POLICY "client_payment_history_update_all" ON client_payment_history FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "client_payment_history_delete_all" ON client_payment_history;
CREATE POLICY "client_payment_history_delete_all" ON client_payment_history FOR DELETE TO anon USING (true);

-- ACTIVITY LOGS
DROP POLICY IF EXISTS "activity_logs_select_all" ON activity_logs;
CREATE POLICY "activity_logs_select_all" ON activity_logs FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "activity_logs_insert_all" ON activity_logs;
CREATE POLICY "activity_logs_insert_all" ON activity_logs FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "activity_logs_update_all" ON activity_logs;
CREATE POLICY "activity_logs_update_all" ON activity_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "activity_logs_delete_all" ON activity_logs;
CREATE POLICY "activity_logs_delete_all" ON activity_logs FOR DELETE TO anon USING (true);

-- SYSTEM SETTINGS
DROP POLICY IF EXISTS "system_settings_select_all" ON system_settings;
CREATE POLICY "system_settings_select_all" ON system_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "system_settings_insert_all" ON system_settings;
CREATE POLICY "system_settings_insert_all" ON system_settings FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "system_settings_update_all" ON system_settings;
CREATE POLICY "system_settings_update_all" ON system_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "system_settings_delete_all" ON system_settings;
CREATE POLICY "system_settings_delete_all" ON system_settings FOR DELETE TO anon USING (true);


-- ============================================================
-- 18. SEED DEFAULT SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (id, company_name, company_address, company_email, company_phone, gstin, invoice_prefix, currency, tax_rate, backup_interval)
VALUES (1, 'NH Homes Civil Equipment Rental', 'Panvel, Navi Mumbai, Maharashtra', 'contact@nhhomes.in', '+91 98765 43210', '', 'INV', 'INR', 18.00, 'daily')
ON CONFLICT (id) DO NOTHING;
