/*
  # Fix workshop_costs RLS policies
  
  This migration updates the RLS policies for workshop_costs table to work with
  the new analysis table structure that uses user_id instead of workshop_id.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "workshop_costs_workshop_policy" ON workshop_costs;
DROP POLICY IF EXISTS "workshop_costs_admin_policy" ON workshop_costs;

-- Create new policies that work with user_id
CREATE POLICY "workshop_costs_user_policy" ON workshop_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM analysis a
            WHERE a.id = workshop_costs.analysis_id
            AND a.user_id = auth.uid()
        )
    );

-- Policy for admin users to view all costs
CREATE POLICY "workshop_costs_admin_policy" ON workshop_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );