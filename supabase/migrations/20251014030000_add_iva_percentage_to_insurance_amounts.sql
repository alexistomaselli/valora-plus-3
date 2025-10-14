-- Add IVA percentage field to insurance_amounts table
-- This field stores the IVA percentage that comes from n8n

ALTER TABLE insurance_amounts 
ADD COLUMN iva_percentage DECIMAL(5,2);

-- Add comment to document the field
COMMENT ON COLUMN insurance_amounts.iva_percentage IS 'IVA percentage applied to the insurance amounts (e.g., 21.00 for 21%)';