-- security.sql
-- This file contains all Row Level Security policies.

-- Step 1: Enable RLS on both tables.
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations_2025_2026 ENABLE ROW LEVEL SECURITY;

-- Step 2: Purge any existing old policies from both tables.
DROP POLICY IF EXISTS "Allow public read access to active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow anonymous full access to manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow public insert access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON public.registrations_2025_2026;

-- Step 3: Create fresh, correct policies.
-- Policy for 'schedules' table
CREATE POLICY "Allow public read access to active schedules" ON public.schedules FOR SELECT TO anon USING (is_active = true);
-- This is insecure but per your setup. For production, change 'anon' to 'authenticated'.
CREATE POLICY "Allow anonymous full access to manage schedules" ON public.schedules FOR ALL TO anon USING (true) WITH CHECK (true);

-- Policies for 'registrations_2025_2026' table
CREATE POLICY "Allow public insert access" ON public.registrations_2025_2026 FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users only" ON public.registrations_2025_2026 FOR SELECT TO authenticated USING (true);

-- Confirmation message
SELECT 'RLS policies have been set.' AS status;