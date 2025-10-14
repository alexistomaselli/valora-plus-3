/*
  # Change workshop_id to user_id in analysis table
  
  This migration changes the analysis table to use user_id instead of workshop_id
  to properly associate analysis records with individual users rather than workshops.
*/

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE analysis DROP CONSTRAINT IF EXISTS analysis_workshop_id_fkey;

-- Drop the existing index on workshop_id if it exists
DROP INDEX IF EXISTS idx_analysis_workshop_id;

-- Rename the column from workshop_id to user_id
ALTER TABLE analysis RENAME COLUMN workshop_id TO user_id;

-- Add the new foreign key constraint to auth.users
ALTER TABLE analysis 
ADD CONSTRAINT analysis_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on the new user_id column
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis(user_id);

-- Update RLS policies to use user_id instead of workshop_id
DROP POLICY IF EXISTS "Users can view their own analysis" ON analysis;
CREATE POLICY "Users can view their own analysis" ON analysis
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analysis" ON analysis;
CREATE POLICY "Users can insert their own analysis" ON analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analysis" ON analysis;
CREATE POLICY "Users can update their own analysis" ON analysis
  FOR UPDATE USING (auth.uid() = user_id);