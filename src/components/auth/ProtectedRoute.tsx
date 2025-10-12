import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['admin_mechanic', 'admin', 'mechanic']
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Establecer un tiempo máximo para la carga
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setAuthTimeout(true);
      }
    }, 2000); // 2 segundos máximo de espera

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Si está cargando y no ha expirado el tiempo, mostrar un indicador de carga
  if (isLoading && !authTimeout) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  // Si ha expirado el tiempo de carga o no hay usuario, redirigir al login
  if (authTimeout || !user) {
    return <Navigate to="/login" />;
  }

  // Si hay roles permitidos y el usuario no tiene uno de esos roles, redirigir a página no autorizada
  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" />;
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
};