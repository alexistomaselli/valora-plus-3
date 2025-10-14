-- Create documents bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  20971520, -- 20MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;