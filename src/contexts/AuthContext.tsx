import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Profile, AuthUser } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { full_name: string, workshop_name: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la aplicación
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
          });
          
          // Obtener el perfil del usuario
          try {
            const { data, error } = await supabase
              .from('profiles' as any)
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (error) {
              console.error('Error al obtener perfil:', error);
              
              // Si el perfil no existe, lo creamos
              if (error.code === 'PGRST116') {
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles' as any)
                  .insert({ 
                    id: user.id,
                    email: user.email || '',
                    role: 'admin_mechanic'
                  })
                  .select()
                  .single();
                  
                if (insertError) {
                  console.error('Error al crear perfil:', insertError);
                } else if (newProfile) {
                  setProfile(newProfile as unknown as Profile);
                }
              }
            } else if (data) {
              setProfile(data as unknown as Profile);
            }
          } catch (error) {
            console.error('Error inesperado al obtener perfil:', error);
          }
        }
      } catch (error) {
        console.error('Error al verificar el usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          
          // Obtener el perfil del usuario
          try {
            const { data, error } = await supabase
              .from('profiles' as any)
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error('Error al obtener perfil:', error);
              
              // Si el perfil no existe, lo creamos
              if (error.code === 'PGRST116') {
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles' as any)
                  .insert({ 
                    id: session.user.id,
                    email: session.user.email || '',
                    role: 'admin_mechanic'
                  })
                  .select()
                  .single();
                  
                if (insertError) {
                  console.error('Error al crear perfil:', insertError);
                } else if (newProfile) {
                  setProfile(newProfile as unknown as Profile);
                }
              }
            } else if (data) {
              setProfile(data as unknown as Profile);
            }
          } catch (error) {
            console.error('Error inesperado al obtener perfil:', error);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente",
      });
    } catch (error: any) {
      console.error('Error completo durante el inicio de sesión:', error);
      let errorMessage = "Ha ocurrido un error al iniciar sesión";
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Correo electrónico no confirmado. Revisa tu bandeja de entrada";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error al iniciar sesión",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { full_name: string, workshop_name: string }) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (error) throw error;
      
      // Asignar rol admin_mechanic por defecto y guardar workshop_name
      if (data.user) {
        // Verificar si el perfil ya existe
        const { data: existingProfile } = await supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (existingProfile) {
          // Actualizar el perfil existente
          const { error: profileError } = await supabase
            .from('profiles' as any)
            .update({ 
              role: 'admin_mechanic',
              workshop_name: userData.workshop_name,
              full_name: userData.full_name
            })
            .eq('id', data.user.id);
            
          if (profileError) {
            console.error('Error al actualizar perfil:', profileError);
            throw profileError;
          }
        } else {
          // Insertar un nuevo perfil si no existe
          const { error: insertError } = await supabase
            .from('profiles' as any)
            .insert({ 
              id: data.user.id,
              role: 'admin_mechanic',
              workshop_name: userData.workshop_name,
              full_name: userData.full_name,
              email: email
            });
            
          if (insertError) {
            console.error('Error al crear perfil:', insertError);
            throw insertError;
          }
        }
      }
      
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
    } catch (error: any) {
      console.error('Error completo durante el registro:', error);
      let errorMessage = "Ha ocurrido un error al crear la cuenta";
      
      if (error.message) {
        if (error.message.includes('Email already registered')) {
          errorMessage = "Este correo electrónico ya está registrado";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "Ha ocurrido un error al cerrar sesión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un correo para restablecer tu contraseña",
      });
    } catch (error: any) {
      toast({
        title: "Error al enviar el correo",
        description: error.message || "Ha ocurrido un error al enviar el correo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}