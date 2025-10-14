-- Add valuation_date field to analysis table
-- This field stores the valuation date from the PDF document (extracted by n8n)
-- Different from analysis_date which is the current date when the analysis is created

ALTER TABLE analysis 
ADD COLUMN valuation_date DATE;

-- Add comment to document the purpose of this field
COMMENT ON COLUMN analysis.valuation_date IS 'Valuation date extracted from PDF document by n8n';