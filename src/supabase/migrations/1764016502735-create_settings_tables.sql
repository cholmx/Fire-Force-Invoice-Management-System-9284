/*
# Create settings and office info tables
1. New Tables
   - `settings_ff2024` (Stores app settings like tax rate)
   - `office_info_ff2024` (Stores office contact info)
2. Security
   - Enable RLS on both tables
   - Add policies for authenticated users to read/write
*/

-- Settings Table
CREATE TABLE IF NOT EXISTS settings_ff2024 (
  key text PRIMARY KEY,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings_ff2024 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access settings" ON settings_ff2024 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access settings" ON settings_ff2024 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access settings" ON settings_ff2024 FOR UPDATE TO authenticated USING (true);

-- Office Info Table
CREATE TABLE IF NOT EXISTS office_info_ff2024 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  address text,
  phone text,
  emergency_phone text,
  email text,
  service_email text,
  username text,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE office_info_ff2024 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access office_info" ON office_info_ff2024 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access office_info" ON office_info_ff2024 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access office_info" ON office_info_ff2024 FOR UPDATE TO authenticated USING (true);