-- ============================================================
-- NH HOMES - ENABLE RLS + ADD MISSING COLUMNS
-- Run this in Supabase SQL Editor if tables already exist
-- ============================================================

-- Add missing columns to employees (if not present)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;

-- Add missing columns to rental_requests
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS security_deposit_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS gst_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS discount_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS rental_charges_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS grand_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS additional_charges JSONB DEFAULT '{}';
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- Add missing columns to rental_request_items
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS taxes NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS expected_return_date DATE;
ALTER TABLE rental_request_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing columns to system_settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rental_rules TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notification_email_alerts BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notification_sms_alerts BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notification_return_reminders BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notification_payment_reminders BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS last_backup_date TEXT;

-- Add rental_number to equipment_rental_history
ALTER TABLE equipment_rental_history ADD COLUMN IF NOT EXISTS rental_number TEXT;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

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
-- RLS POLICIES - Allow anon role full CRUD access
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles','employees','clients','inventory_items',
    'equipment_specifications','maintenance_records',
    'rental_requests','rental_request_items',
    'equipment_rental_history','client_rental_history',
    'client_payment_history','activity_logs','system_settings'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_all" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_select_all" ON %I FOR SELECT TO anon USING (true)', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_all" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert_all" ON %I FOR INSERT TO anon WITH CHECK (true)', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_all" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update_all" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_all" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete_all" ON %I FOR DELETE TO anon USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- SEED DEFAULT SYSTEM SETTINGS (if empty)
-- ============================================================

INSERT INTO system_settings (id, company_name, company_address, company_email, company_phone, currency, tax_rate, backup_interval)
VALUES (1, 'NH Homes Civil Equipment Rental', 'Panvel, Navi Mumbai', 'contact@nhhomes.in', '+91 98765 43210', 'INR', 18.00, 'daily')
ON CONFLICT (id) DO NOTHING;

SELECT 'RLS enabled successfully on all tables!' AS result;
