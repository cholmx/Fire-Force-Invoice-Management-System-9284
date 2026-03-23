/*
# Fix RLS Policies for Anonymous Access

The app uses Supabase with anon key (no user auth), so all RLS policies
must allow the `anon` role, not just `authenticated`.

1. Changes
   - Drop existing authenticated-only policies
   - Add anon + authenticated policies for all tables
   - Add company column to customers_ff2024 if missing
   - Insert default tax rate row if settings table is empty
*/

-- Fix settings_ff2024 policies
DROP POLICY IF EXISTS "Allow authenticated read access settings" ON settings_ff2024;
DROP POLICY IF EXISTS "Allow authenticated insert access settings" ON settings_ff2024;
DROP POLICY IF EXISTS "Allow authenticated update access settings" ON settings_ff2024;

CREATE POLICY "Allow all read settings" ON settings_ff2024 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert settings" ON settings_ff2024 FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update settings" ON settings_ff2024 FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Allow all delete settings" ON settings_ff2024 FOR DELETE TO anon, authenticated USING (true);

-- Fix office_info_ff2024 policies
DROP POLICY IF EXISTS "Allow authenticated read access office_info" ON office_info_ff2024;
DROP POLICY IF EXISTS "Allow authenticated insert access office_info" ON office_info_ff2024;
DROP POLICY IF EXISTS "Allow authenticated update access office_info" ON office_info_ff2024;

CREATE POLICY "Allow all read office_info" ON office_info_ff2024 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert office_info" ON office_info_ff2024 FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update office_info" ON office_info_ff2024 FOR UPDATE TO anon, authenticated USING (true);

-- Add company column to customers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_ff2024' AND column_name = 'company'
  ) THEN
    ALTER TABLE customers_ff2024 ADD COLUMN company text DEFAULT '';
  END IF;
END $$;

-- Insert default tax rate if not present
INSERT INTO settings_ff2024 (key, value)
VALUES ('tax_rate', '8.0')
ON CONFLICT (key) DO NOTHING;