// Importamos la biblioteca de Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://piynzvpnurnvbrmkyneo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeW56dnBudXJudmJybWt5bmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjk0MzMsImV4cCI6MjA3NTk0NTQzM30.OJH_xmSuTE6Q0Pen5rswn5VSUdSfARyvjCKDV_xVPfE';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // 1. Registrar el usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'dydsoftware1@gmail.com',
      password: 'admin123',
    });

    if (authError) {
      console.error('Error al crear el usuario:', authError);
      return;
    }

    console.log('Usuario creado exitosamente:', authData.user.id);

    // 2. Actualizar el perfil con rol de administrador y nombre
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        full_name: 'Admin'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error al actualizar el perfil:', profileError);
      return;
    }

    console.log('Perfil actualizado exitosamente con rol de administrador y nombre "Admin"');
    console.log('Email:', 'dydsoftware1@gmail.com');
    console.log('Password:', 'admin123');
    console.log('Rol:', 'admin');
    console.log('Nombre:', 'Admin');
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar la función
createAdminUser();