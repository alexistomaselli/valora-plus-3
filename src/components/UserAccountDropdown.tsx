import { User, LogOut, Settings, BarChart3, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthlyUsage } from "@/hooks/use-monthly-usage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserAccountDropdown() {
  const { user, profile, workshop, signOut } = useAuth();
  const { usage, loading: usageLoading } = useMonthlyUsage();

  // Datos del usuario desde el contexto de autenticación
  const userData = {
    email: user?.email || "No especificado",
    taller: workshop?.name || "Taller no especificado",
    full_name: profile?.full_name || 
               user?.identities?.[0]?.identity_data?.full_name || 
               user?.user_metadata?.display_name || 
               user?.email?.split('@')[0] || 
               "Usuario",
    role: profile?.role || "usuario"
  };

  // Obtener las iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(userData.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium leading-none">{userData.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {userData.email}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {userData.role === 'admin' ? 'Admin' : 
                 userData.role === 'admin_mechanic' ? 'Admin Mecánico' : 'Usuario'}
              </Badge>
            </div>
            
            {userData.taller !== "Taller no especificado" && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Taller:</span> {userData.taller}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">Uso mensual:</span>
              {usageLoading ? (
                <Badge variant="secondary" className="text-xs">
                  Cargando...
                </Badge>
              ) : usage ? (
                <Badge 
                  variant={usage.remainingFreeAnalyses === 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {usage.totalAnalyses}/{usage.freeAnalysesLimit} análisis
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  0/3 análisis
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link 
            to={userData.role === 'admin' ? '/admin/dashboard' : '/app/micuenta'} 
            className="flex items-center w-full"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mi Cuenta</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/app/nuevo" className="flex items-center w-full">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Nuevo Análisis</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/app/historial-pagos" className="flex items-center w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Historial de Pagos</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}