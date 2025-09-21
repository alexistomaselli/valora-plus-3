import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, BarChart3, Calendar, FileText, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const MyAccount = () => {
  // Mock user data - in real app this would come from API
  const user = {
    email: "demo@taller.es",
    taller: "Taller Demo SL",
    phone: "612 345 678",
    created_at: "2024-01-15",
    monthlyUsage: 1,
    maxUsage: 3
  };

  // Mock analysis history
  const analyses = [
    {
      id: "demo-case-id",
      referencia: "161832151335",
      matricula: "5654LGR",
      fecha: "2024-08-14",
      margen_eur: 2060.71,
      margen_pct: 44.37,
      status: "completed"
    },
    // Additional mock data for demonstration
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' €';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const averageMargin = analyses.length > 0 
    ? analyses.reduce((sum, analysis) => sum + analysis.margen_pct, 0) / analyses.length 
    : 0;

  const totalMargin = analyses.reduce((sum, analysis) => sum + analysis.margen_eur, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mi Cuenta</h1>
        <p className="text-lg text-muted-foreground">
          Gestiona tu perfil y revisa el historial de análisis
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Perfil del Taller</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre del taller</p>
                <p className="font-medium text-foreground">{user.taller}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium text-foreground">{user.phone || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium text-foreground">{formatDate(user.created_at)}</p>
              </div>
              <Button variant="outline" className="w-full">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Usage quota */}
          <Card className={user.monthlyUsage >= user.maxUsage ? "border-warning" : "border-border"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Uso Mensual</span>
                </div>
                <Badge variant={user.monthlyUsage >= user.maxUsage ? "destructive" : "secondary"}>
                  {user.monthlyUsage}/{user.maxUsage}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Análisis utilizados</span>
                    <span>{user.monthlyUsage} de {user.maxUsage}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        user.monthlyUsage >= user.maxUsage ? 'bg-destructive' : 'bg-gradient-primary'
                      }`}
                      style={{ width: `${(user.monthlyUsage / user.maxUsage) * 100}%` }}
                    />
                  </div>
                </div>
                
                {user.monthlyUsage >= user.maxUsage ? (
                  <div className="bg-warning-soft border border-warning/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Crown className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning-foreground mb-1">
                          Límite alcanzado
                        </p>
                        <p className="text-sm text-warning-foreground/80 mb-3">
                          Has utilizado todos tus análisis gratuitos este mes. 
                          Actualiza a un plan premium para continuar.
                        </p>
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                          Ver Planes Premium
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Te quedan {user.maxUsage - user.monthlyUsage} análisis gratuitos este mes
                    </p>
                    <Link to="/app/nuevo">
                      <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">
                        Nuevo Análisis
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis history and stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Análisis</p>
                    <p className="text-xl font-bold text-foreground">{analyses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margen Promedio</p>
                    <p className="text-xl font-bold text-foreground">
                      {averageMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded">
                    <BarChart3 className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margen Total</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(totalMargin)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Historial de Análisis</span>
              </CardTitle>
              <CardDescription>
                Revisa todos los análisis de rentabilidad realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="font-medium text-foreground">
                              {analysis.matricula}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              Ref: {analysis.referencia}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(analysis.fecha)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div>
                              <span className="text-sm text-muted-foreground">Margen: </span>
                              <span className="font-medium text-success">
                                {formatCurrency(analysis.margen_eur)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Rentabilidad: </span>
                              <span className="font-medium text-foreground">
                                {analysis.margen_pct.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link to={`/app/resultados/${analysis.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No tienes análisis aún
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Empieza tu primer análisis de rentabilidad para ver el historial aquí
                  </p>
                  <Link to="/app/nuevo">
                    <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                      Crear Primer Análisis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;