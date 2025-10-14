/*
  # Add IVA percentage column to insurance_amounts

  1. Changes
    - Add `iva_percentage` column to store the IVA percentage (e.g., 21, 16, etc.)
    - Column is nullable to support existing data
    - Default value is NULL (will be filled by the application)

  2. Notes
    - This allows tracking the IVA percentage used in calculations
    - Complements the existing `iva_amount` column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_amounts' AND column_name = 'iva_percentage'
  ) THEN
    ALTER TABLE insurance_amounts ADD COLUMN iva_percentage numeric;
  END IF;
END $$;