import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Verification = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [confidence, setConfidence] = useState(0.92);
  const { toast } = useToast();

  // Get extracted data from webhook response stored in sessionStorage
  const [extractedData, setExtractedData] = useState(() => {
    const storedData = sessionStorage.getItem('webhookResponseData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Update confidence based on webhook response if available
        if (parsedData.confidence) {
          setConfidence(parsedData.confidence);
        }
        
        // Return webhook data structure or fallback to mock data
        return parsedData.extractedData || {
          metadata: {
            matricula: parsedData.matricula || "5654LGR",
            bastidor: parsedData.bastidor || "SAJBB4BN8LCY87550", 
            fabricante: parsedData.fabricante || "JAGUAR",
            modelo: parsedData.modelo || "XF (X250)",
            fecha: parsedData.fecha || "2024-08-14",
            referencia: parsedData.referencia || "161832151335",
            sistema: parsedData.sistema || "AUDATEX",
            precio_hora: parsedData.precio_hora || "59.00"
          },
          totales: {
            repuestos_total: parsedData.repuestos_total || "942.16",
            mo_chapa_ut: parsedData.mo_chapa_ut || "285.0",
            mo_chapa_eur: parsedData.mo_chapa_eur || "1681.50",
            mo_pintura_ut: parsedData.mo_pintura_ut || "130.5", 
            mo_pintura_eur: parsedData.mo_pintura_eur || "769.95",
            mat_pintura_eur: parsedData.mat_pintura_eur || "1251.10",
            subtotal_neto: parsedData.subtotal_neto || "4644.71",
            iva: parsedData.iva || "975.39",
            total_con_iva: parsedData.total_con_iva || "5620.10"
          }
        };
      } catch (error) {
        console.error('Error parsing webhook data:', error);
      }
    }
    
    // Fallback to mock data if no webhook data available
    return {
      metadata: {
        matricula: "5654LGR",
        bastidor: "SAJBB4BN8LCY87550", 
        fabricante: "JAGUAR",
        modelo: "XF (X250)",
        fecha: "2024-08-14",
        referencia: "161832151335",
        sistema: "AUDATEX",
        precio_hora: "59.00"
      },
      totales: {
        repuestos_total: "942.16",
        mo_chapa_ut: "285.0",
        mo_chapa_eur: "1681.50",
        mo_pintura_ut: "130.5", 
        mo_pintura_eur: "769.95",
        mat_pintura_eur: "1251.10",
        subtotal_neto: "4644.71",
        iva: "975.39",
        total_con_iva: "5620.10"
      }
    };
  });

  const handleInputChange = (section: string, field: string, value: string) => {
    setExtractedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleContinue = () => {
    toast({
      title: "Datos verificados",
      description: "Continuando al siguiente paso...",
    });
    // Redirect to costs input
    setTimeout(() => {
      window.location.href = '/app/costes/demo-case-id';
    }, 1000);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' €';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verificar Datos Extraídos
          </h1>
          <p className="text-lg text-muted-foreground">
            Revisa y corrige los datos extraídos del PDF antes de continuar
          </p>
        </div>
        <Link to="/app/nuevo">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        </Link>
      </div>

      {/* Confidence indicator */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {confidence >= 0.8 ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-warning" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  Confianza de extracción: {(confidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {confidence >= 0.8 
                    ? "Los datos se han extraído con alta precisión" 
                    : "Revisa cuidadosamente los campos marcados"
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              {isEditing ? 'Finalizar edición' : 'Editar datos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Vehicle metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Vehículo</CardTitle>
            <CardDescription>
              Información básica extraída del expediente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={extractedData.metadata.matricula}
                  onChange={(e) => handleInputChange('metadata', 'matricula', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={extractedData.metadata.fecha}
                  onChange={(e) => handleInputChange('metadata', 'fecha', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bastidor">Número de bastidor</Label>
              <Input
                id="bastidor"
                value={extractedData.metadata.bastidor}
                onChange={(e) => handleInputChange('metadata', 'bastidor', e.target.value)}
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted/50" : ""}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={extractedData.metadata.fabricante}
                  onChange={(e) => handleInputChange('metadata', 'fabricante', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={extractedData.metadata.modelo}
                  onChange={(e) => handleInputChange('metadata', 'modelo', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  value={extractedData.metadata.referencia}
                  onChange={(e) => handleInputChange('metadata', 'referencia', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="sistema">Sistema</Label>
                <Input
                  id="sistema"
                  value={extractedData.metadata.sistema}
                  onChange={(e) => handleInputChange('metadata', 'sistema', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="precio_hora">Precio por hora (€)</Label>
              <Input
                id="precio_hora"
                value={extractedData.metadata.precio_hora}
                onChange={(e) => handleInputChange('metadata', 'precio_hora', e.target.value)}
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted/50" : ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial data */}
        <Card>
          <CardHeader>
            <CardTitle>Importes de la Aseguradora</CardTitle>
            <CardDescription>
              Totales extraídos de la valoración (sin IVA)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="repuestos_total">Total Repuestos</Label>
              <div className="relative">
                <Input
                  id="repuestos_total"
                  value={extractedData.totales.repuestos_total}
                  onChange={(e) => handleInputChange('totales', 'repuestos_total', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
                {!isEditing && (
                  <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    {formatCurrency(extractedData.totales.repuestos_total)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mo_chapa_ut">M.O. Chapa (UT)</Label>
                <Input
                  id="mo_chapa_ut"
                  value={extractedData.totales.mo_chapa_ut}
                  onChange={(e) => handleInputChange('totales', 'mo_chapa_ut', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="mo_chapa_eur">M.O. Chapa (€)</Label>
                <div className="relative">
                  <Input
                    id="mo_chapa_eur"
                    value={extractedData.totales.mo_chapa_eur}
                    onChange={(e) => handleInputChange('totales', 'mo_chapa_eur', e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted/50" : ""}
                  />
                  {!isEditing && (
                    <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      {formatCurrency(extractedData.totales.mo_chapa_eur)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mo_pintura_ut">M.O. Pintura (UT)</Label>
                <Input
                  id="mo_pintura_ut"
                  value={extractedData.totales.mo_pintura_ut}
                  onChange={(e) => handleInputChange('totales', 'mo_pintura_ut', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="mo_pintura_eur">M.O. Pintura (€)</Label>
                <div className="relative">
                  <Input
                    id="mo_pintura_eur"
                    value={extractedData.totales.mo_pintura_eur}
                    onChange={(e) => handleInputChange('totales', 'mo_pintura_eur', e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted/50" : ""}
                  />
                  {!isEditing && (
                    <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      {formatCurrency(extractedData.totales.mo_pintura_eur)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="mat_pintura_eur">Materiales Pintura (€)</Label>
              <div className="relative">
                <Input
                  id="mat_pintura_eur"
                  value={extractedData.totales.mat_pintura_eur}
                  onChange={(e) => handleInputChange('totales', 'mat_pintura_eur', e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/50" : ""}
                />
                {!isEditing && (
                  <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    {formatCurrency(extractedData.totales.mat_pintura_eur)}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subtotal_neto">Subtotal sin IVA</Label>
                  <div className="relative">
                    <Input
                      id="subtotal_neto"
                      value={extractedData.totales.subtotal_neto}
                      onChange={(e) => handleInputChange('totales', 'subtotal_neto', e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted/50 font-semibold" : "font-semibold"}
                    />
                    {!isEditing && (
                      <div className="absolute right-3 top-2.5 text-sm font-semibold text-foreground">
                        {formatCurrency(extractedData.totales.subtotal_neto)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="total_con_iva">Total con IVA</Label>
                  <div className="relative">
                    <Input
                      id="total_con_iva"
                      value={extractedData.totales.total_con_iva}
                      onChange={(e) => handleInputChange('totales', 'total_con_iva', e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                    {!isEditing && (
                      <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                        {formatCurrency(extractedData.totales.total_con_iva)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue button */}
      <Card className="bg-primary-soft border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary mb-1">Datos verificados</h3>
              <p className="text-sm text-primary/80">
                Continúa al siguiente paso para introducir los costes reales de tu taller
              </p>
            </div>
            <Button 
              onClick={handleContinue}
              className="bg-gradient-primary text-primary-foreground shadow-glow"
            >
              Introducir Costes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verification;