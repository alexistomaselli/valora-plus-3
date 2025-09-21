import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, ArrowLeft, TrendingUp, TrendingDown, Minus, FileText, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Results = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Mock calculation results based on the Excel example
  const results = {
    case_id: "demo-case-id",
    metadata: {
      matricula: "5654LGR",
      referencia: "161832151335",
      fecha: "2024-08-14",
      taller: "Taller Demo SL"
    },
    ingresos_totales: 4644.71,
    costes_totales: 2584.00,
    margen_eur: 2060.71,
    margen_pct: 44.37,
    margen_detallado: {
      repuestos: { ingresos: 942.16, costes: 750.00, margen: 192.16 },
      mo_chapa: { ingresos: 1681.50, costes: 704.00, margen: 977.50 },
      mo_pintura: { ingresos: 769.95, costes: 280.00, margen: 489.95 },
      mat_pintura: { ingresos: 1251.10, costes: 400.00, margen: 851.10 }
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' €';
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const getMarginColor = (margin: number) => {
    if (margin > 30) return "text-success";
    if (margin > 15) return "text-warning";
    return "text-destructive";
  };

  const getMarginIcon = (margin: number) => {
    if (margin > 30) return <TrendingUp className="h-4 w-4" />;
    if (margin > 15) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    // Simulate PDF generation
    setTimeout(() => {
      setIsDownloading(false);
      toast({
        title: "PDF generado",
        description: "El informe se ha descargado correctamente.",
      });
    }, 2000);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    
    // Simulate email sending
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Email enviado",
        description: "El informe se ha enviado a tu correo electrónico.",
      });
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Análisis de Rentabilidad
          </h1>
          <p className="text-lg text-muted-foreground">
            Expediente {results.metadata.referencia} • {results.metadata.matricula}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/app/costes/demo-case-id">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          </Link>
          <Button 
            onClick={handleSendEmail}
            disabled={isSending}
            variant="outline"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSending ? 'Enviando...' : 'Enviar por Email'}
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-gradient-primary text-primary-foreground shadow-glow"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Generando...' : 'Descargar PDF'}
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(results.ingresos_totales)}</p>
                <p className="text-xs text-muted-foreground mt-1">Importe aseguradora (sin IVA)</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Costes Totales</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(results.costes_totales)}</p>
                <p className="text-xs text-muted-foreground mt-1">Costes reales del taller</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success-foreground/80 mb-1">Margen Neto</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(results.margen_eur)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge className={`${getMarginColor(results.margen_pct)} bg-success-soft border-success/20`}>
                    {getMarginIcon(results.margen_pct)}
                    <span className="ml-1">{formatPercentage(results.margen_pct)}</span>
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-success-foreground/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Breakdown table */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Concepto</CardTitle>
            <CardDescription>
              Comparativa detallada de ingresos vs costes por bloque de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(results.margen_detallado).map(([key, data]) => {
                const titles = {
                  repuestos: 'Repuestos',
                  mo_chapa: 'M.O. Chapa',
                  mo_pintura: 'M.O. Pintura',
                  mat_pintura: 'Mat. Pintura'
                };
                
                const marginPct = data.ingresos > 0 ? (data.margen / data.ingresos) * 100 : 0;
                
                return (
                  <div key={key} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">
                        {titles[key as keyof typeof titles]}
                      </h4>
                      <Badge variant={marginPct > 30 ? "default" : marginPct > 15 ? "secondary" : "destructive"}>
                        {formatPercentage(marginPct)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Ingresos</p>
                        <p className="font-medium">{formatCurrency(data.ingresos)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costes</p>
                        <p className="font-medium">{formatCurrency(data.costes)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margen</p>
                        <p className={`font-medium ${data.margen >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(data.margen)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Visual representation */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Márgenes</CardTitle>
            <CardDescription>
              Visualización de la rentabilidad por concepto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(results.margen_detallado).map(([key, data]) => {
                const titles = {
                  repuestos: 'Repuestos',
                  mo_chapa: 'M.O. Chapa',
                  mo_pintura: 'M.O. Pintura',
                  mat_pintura: 'Mat. Pintura'
                };
                
                const marginPct = data.ingresos > 0 ? (data.margen / data.ingresos) * 100 : 0;
                const barWidth = Math.max(marginPct, 5); // Minimum 5% for visibility
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{titles[key as keyof typeof titles]}</span>
                      <span className="text-muted-foreground">{formatCurrency(data.margen)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          marginPct > 30 ? 'bg-gradient-success' : 
                          marginPct > 15 ? 'bg-gradient-primary' : 
                          'bg-destructive'
                        }`}
                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(marginPct)} de rentabilidad
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary and recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Resumen Ejecutivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground mb-4">
              <strong>Análisis del expediente {results.metadata.referencia}:</strong> El análisis muestra 
              una rentabilidad global del <strong className={getMarginColor(results.margen_pct)}>
              {formatPercentage(results.margen_pct)}</strong>, generando un margen neto de <strong className="text-success">
              {formatCurrency(results.margen_eur)}</strong>.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Puntos Fuertes:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• M.O. Chapa: excelente margen del {formatPercentage((results.margen_detallado.mo_chapa.margen / results.margen_detallado.mo_chapa.ingresos) * 100)}</li>
                  <li>• Materiales pintura: rentabilidad del {formatPercentage((results.margen_detallado.mat_pintura.margen / results.margen_detallado.mat_pintura.ingresos) * 100)}</li>
                  <li>• Gestión eficiente de costes laborales</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Oportunidades de Mejora:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Revisar proveedores de repuestos para mejor margen</li>
                  <li>• Optimizar tiempos de mano de obra de pintura</li>
                  <li>• Negociar mejores tarifas con aseguradoras</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <Card className="bg-primary-soft border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <h3 className="font-semibold text-primary mb-1">¿Te ha sido útil este análisis?</h3>
              <p className="text-sm text-primary/80">
                Comparte tu informe o inicia un nuevo análisis para optimizar más expedientes
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-primary/20">
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
              <Link to="/app/nuevo">
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                  Nuevo Análisis
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;