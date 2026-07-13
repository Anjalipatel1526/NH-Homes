-- ============================================================
-- NH HOMES CIVIL EQUIPMENT RENTAL - SUPABASE SQL SCHEMA (NO RLS)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ========================
-- 1. CUSTOM TYPES (ENUMS)
-- ========================

CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');
CREATE TYPE employee_status AS ENUM ('Active', 'Inactive');
CREATE TYPE client_status AS ENUM ('Active', 'Inactive');
CREATE TYPE inventory_status AS ENUM ('Available', 'Rented', 'Maintenance', 'Reserved', 'Lost', 'Damaged');
CREATE TYPE rental_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Partial', 'Overdue');
CREATE TYPE payment_method AS ENUM ('UPI', 'Cash', 'Cheque', 'Bank Transfer');
CREATE TYPE rental_history_status AS ENUM ('Active', 'Completed', 'Overdue');
CREATE TYPE client_rental_status AS ENUM ('Active', 'Completed', 'Pending', 'Overdue');
CREATE TYPE client_payment_status AS ENUM ('Completed', 'Partial', 'Pending');
CREATE TYPE activity_type AS ENUM ('create', 'update', 'delete', 'auth', 'system', 'payment', 'rental');
CREATE TYPE backup_interval AS ENUM ('daily', 'weekly', 'monthly');


-- ========================
-- 2. PROFILES TABLE (linked to Supabase Auth)
-- ========================

CREATE TABLE profiles (
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

CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status employee_status NOT NULL DEFAULT 'Active',
  joining_date DATE NOT NULL,
  salary NUMERIC(10,2) NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  tasks_completed INTEGER DEFAULT 0,
  efficiency INTEGER DEFAULT 100,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 4. CLIENTS TABLE
-- ========================

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status client_status NOT NULL DEFAULT 'Active',
  outstanding_payment NUMERIC(12,2) DEFAULT 0.00,
  total_rentals INTEGER DEFAULT 0,
  address TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 5. INVENTORY ITEMS TABLE
-- ========================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT UNIQUE NOT NULL,
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

CREATE TABLE equipment_specifications (
  id BIGSERIAL PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL
);


-- ========================
-- 7. MAINTENANCE RECORDS TABLE
-- ========================

CREATE TABLE maintenance_records (
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

CREATE TABLE rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_number TEXT UNIQUE,
  invoice_number TEXT UNIQUE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  project_lead TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  status rental_status NOT NULL DEFAULT 'Pending',
  total_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0.00,
  security_deposit NUMERIC(12,2) DEFAULT 0.00,
  delivery_charges NUMERIC(10,2) DEFAULT 0.00,
  loading_unloading_charges NUMERIC(10,2) DEFAULT 0.00,
  operator_charges NUMERIC(10,2) DEFAULT 0.00,
  extra_hours_charges NUMERIC(10,2) DEFAULT 0.00,
  damage_charges NUMERIC(10,2) DEFAULT 0.00,
  gst_rate NUMERIC(4,2) DEFAULT 18.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ========================
-- 9. RENTAL REQUEST ITEMS TABLE
-- ========================

CREATE TABLE rental_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_request_id UUID REFERENCES rental_requests(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  daily_charges NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);


-- ========================
-- 10. EQUIPMENT RENTAL HISTORY TABLE
-- ========================

CREATE TABLE equipment_rental_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status rental_history_status NOT NULL
);


-- ========================
-- 11. CLIENT RENTAL HISTORY TABLE
-- ========================

CREATE TABLE client_rental_history (
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

CREATE TABLE client_payment_history (
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

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  gstin TEXT,
  terms_conditions TEXT,
  backup_interval backup_interval NOT NULL DEFAULT 'daily',
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

CREATE TRIGGER trg_auto_equipment_id
BEFORE INSERT ON inventory_items
FOR EACH ROW
WHEN (NEW.equipment_id IS NULL OR NEW.equipment_id = '')
EXECUTE FUNCTION generate_equipment_id();


-- B. Auto Rental/Invoice Number Generator
CREATE OR REPLACE FUNCTION generate_rental_numbers()
RETURNS TRIGGER AS $$
DECLARE
  next_val INT;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO next_val FROM rental_requests;
  
  IF NEW.rental_number IS NULL OR NEW.rental_number = '' THEN
    NEW.rental_number := 'RENT-' || LPAD(next_val::TEXT, 5, '0');
  END IF;
  
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(next_val::TEXT, 5, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_rental_numbers
BEFORE INSERT ON rental_requests
FOR EACH ROW
EXECUTE FUNCTION generate_rental_numbers();


-- C. Auto update_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_rental_requests_updated_at BEFORE UPDATE ON rental_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
