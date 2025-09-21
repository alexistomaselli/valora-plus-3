import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, User, LogOut, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const AppLayout = () => {
  // Mock user data - in real app this would come from auth context
  const user = {
    email: "demo@taller.es",
    taller: "Taller Demo SL",
    monthlyUsage: 1,
    maxUsage: 3
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Valora Plus</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Usage indicator */}
            <Badge variant={user.monthlyUsage >= user.maxUsage ? "destructive" : "secondary"}>
              {user.monthlyUsage}/{user.maxUsage} análisis este mes
            </Badge>
            
            {/* User menu */}
            <div className="flex items-center space-x-2">
              <div className="text-right text-sm">
                <div className="font-medium text-foreground">{user.taller}</div>
                <div className="text-muted-foreground">{user.email}</div>
              </div>
              <Link to="/app/micuenta">
                <Button variant="ghost" size="sm" className="p-2">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* App Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 py-3">
            <Link 
              to="/app/nuevo" 
              className="flex items-center space-x-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Calculator className="h-4 w-4" />
              <span>Nuevo Análisis</span>
            </Link>
            <Link 
              to="/app/micuenta" 
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Mi Cuenta</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;