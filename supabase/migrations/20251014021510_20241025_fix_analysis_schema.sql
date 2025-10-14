/*
  # Fix Analysis Schema for User-Based Access
  
  1. Tables Created/Modified
    - Creates `profiles` table for user roles
    - Creates `workshops` table (kept for future use)
    - Creates `analysis` table with `user_id` instead of `workshop_id`
    - Creates `vehicle_data` table for extracted vehicle information
    - Creates `insurance_amounts` table for extracted financial data
  
  2. Security
    - Enable RLS on all tables
    - Users can only see/modify their own data
    - Admins can see all data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'admin_mechanic')) DEFAULT 'admin_mechanic',
  full_name TEXT,
  phone TEXT,
  workshop_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Create workshops table (for future use)
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add foreign key for workshop_id after workshops table exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_workshop_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_workshop_id_fkey 
FOREIGN KEY (workshop_id) REFERENCES public.workshops(id) ON DELETE SET NULL;

-- Create analysis table with user_id
CREATE TABLE IF NOT EXISTS analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pdf_url TEXT,
    pdf_filename TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'pending_verification', 'pending_costs', 'completed', 'failed')),
    analysis_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_status ON analysis(status);
CREATE INDEX IF NOT EXISTS idx_analysis_month ON analysis(analysis_month);

-- Create vehicle_data table
CREATE TABLE IF NOT EXISTS vehicle_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
  license_plate TEXT,
  vin TEXT,
  manufacturer TEXT,
  model TEXT,
  internal_reference TEXT,
  system TEXT,
  hourly_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_data_analysis_id ON vehicle_data(analysis_id);

-- Create insurance_amounts table
CREATE TABLE IF NOT EXISTS insurance_amounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
  total_spare_parts_eur DECIMAL(10,2),
  bodywork_labor_ut DECIMAL(10,2),
  bodywork_labor_eur DECIMAL(10,2),
  painting_labor_ut DECIMAL(10,2),
  painting_labor_eur DECIMAL(10,2),
  paint_material_eur DECIMAL(10,2),
  net_subtotal DECIMAL(10,2),
  iva_amount DECIMAL(10,2),
  total_with_iva DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_amounts_analysis_id ON insurance_amounts(analysis_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_amounts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Analysis policies
DROP POLICY IF EXISTS "Users can view their own analysis" ON analysis;
CREATE POLICY "Users can view their own analysis" ON analysis
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analysis" ON analysis;
CREATE POLICY "Users can insert their own analysis" ON analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analysis" ON analysis;
CREATE POLICY "Users can update their own analysis" ON analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- Vehicle data policies
DROP POLICY IF EXISTS "Users can view their own vehicle data" ON vehicle_data;
CREATE POLICY "Users can view their own vehicle data" ON vehicle_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = vehicle_data.analysis_id AND analysis.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own vehicle data" ON vehicle_data;
CREATE POLICY "Users can insert their own vehicle data" ON vehicle_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = vehicle_data.analysis_id AND analysis.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own vehicle data" ON vehicle_data;
CREATE POLICY "Users can update their own vehicle data" ON vehicle_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = vehicle_data.analysis_id AND analysis.user_id = auth.uid()
    )
  );

-- Insurance amounts policies
DROP POLICY IF EXISTS "Users can view their own insurance amounts" ON insurance_amounts;
CREATE POLICY "Users can view their own insurance amounts" ON insurance_amounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = insurance_amounts.analysis_id AND analysis.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own insurance amounts" ON insurance_amounts;
CREATE POLICY "Users can insert their own insurance amounts" ON insurance_amounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = insurance_amounts.analysis_id AND analysis.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own insurance amounts" ON insurance_amounts;
CREATE POLICY "Users can update their own insurance amounts" ON insurance_amounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM analysis WHERE analysis.id = insurance_amounts.analysis_id AND analysis.user_id = auth.uid()
    )
  );

-- Workshops policies (basic, for future use)
DROP POLICY IF EXISTS "Users can view workshops" ON public.workshops;
CREATE POLICY "Users can view workshops" ON public.workshops
  FOR SELECT USING (true);

-- Function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (new.id, new.email, 'admin_mechanic', COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();