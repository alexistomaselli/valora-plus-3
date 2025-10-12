// Importamos la biblioteca de Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuración de Supabase
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // 1. Registrar el usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@valoraplus.com',
      password: 'admin123',
    });

    if (authError) {
      console.error('Error al crear el usuario:', authError);
      return;
    }

    console.log('Usuario creado exitosamente:', authData.user.id);

    // 2. Actualizar el perfil con rol de administrador
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error al actualizar el perfil:', profileError);
      return;
    }

    console.log('Perfil actualizado exitosamente con rol de administrador');
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar la función
createAdminUser();