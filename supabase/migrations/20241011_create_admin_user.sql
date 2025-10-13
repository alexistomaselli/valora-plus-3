-- Crear un usuario administrador (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@valoraplus.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      gen_random_uuid(),
      'admin@valoraplus.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    );
  END IF;
END $$;

-- Obtener el ID del usuario recién creado
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@valoraplus.com';
  
  -- Insertar en la tabla profiles con rol de admin
  INSERT INTO public.profiles (id, email, role, full_name, workshop_name)
  VALUES (
    admin_id,
    'admin@valoraplus.com',
    'admin',
    'Administrador Sistema',
    NULL
  ) ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;