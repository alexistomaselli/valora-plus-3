import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, ArrowLeft, TrendingUp, TrendingDown, Minus, FileText, Share2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MargenDetallado {
  ingresos: number;
  costes: number;
  margen: number;
}

interface ResultsData {
  case_id: string;
  metadata: {
    matricula: string;
    referencia: string;
    fecha: string;
    taller: string;
  };
  ingresos_totales: number;
  costes_totales: number;
  margen_eur: number;
  margen_pct: number;
  margen_detallado: {
    repuestos: MargenDetallado;
    mo_chapa: MargenDetallado;
    mo_pintura: MargenDetallado;
    mat_pintura: MargenDetallado;
  };
}

const Results = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadAnalysisData = async () => {
      if (!caseId) {
        setError("No se encontró el ID del análisis");
        setIsLoading(false);
        return;
      }

      try {
        // Load analysis data
        const { data: analysis, error: analysisError } = await supabase
          .from('analysis')
          .select('*')
          .eq('id', caseId)
          .single();

        if (analysisError) throw analysisError;

        // Load vehicle data
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicle_data')
          .select('*')
          .eq('analysis_id', caseId)
          .single();

        if (vehicleError) throw vehicleError;

        // Load insurance amounts
        const { data: insuranceAmounts, error: insuranceError } = await supabase
          .from('insurance_amounts')
          .select('*')
          .eq('analysis_id', caseId)
          .single();

        if (insuranceError) throw insuranceError;

        // Load workshop costs
        const { data: workshopCosts, error: workshopError } = await supabase
          .from('workshop_costs')
          .select('*')
          .eq('analysis_id', caseId)
          .single();

        if (workshopError) throw workshopError;

        // Calculate results
        const calculatedResults = calculateProfitability(
          analysis,
          vehicleData,
          insuranceAmounts,
          workshopCosts
        );

        setResults(calculatedResults);
      } catch (error) {
        console.error('Error loading analysis data:', error);
        setError('Error al cargar los datos del análisis');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysisData();
  }, [caseId]);

  const calculateProfitability = (analysis: any, vehicleData: any, insuranceAmounts: any, workshopCosts: any): ResultsData => {
    // Calculate total income (from insurance)
    const ingresos_totales = insuranceAmounts.total_with_iva || 0;

    // Calculate total costs (from workshop)
    const costes_repuestos = workshopCosts.spare_parts_purchase_cost || 0;
    const costes_mo_chapa = (workshopCosts.bodywork_actual_hours || 0) * (workshopCosts.bodywork_hourly_cost || 0);
    const costes_mo_pintura = (workshopCosts.painting_actual_hours || 0) * (workshopCosts.painting_hourly_cost || 0);
    const costes_mat_pintura = workshopCosts.painting_consumables_cost || 0;
    const costes_otros = (workshopCosts.subcontractor_costs || 0) + (workshopCosts.other_costs || 0);

    const costes_totales = costes_repuestos + costes_mo_chapa + costes_mo_pintura + costes_mat_pintura + costes_otros;

    // Calculate margins
    const margen_eur = ingresos_totales - costes_totales;
    const margen_pct = ingresos_totales > 0 ? (margen_eur / ingresos_totales) * 100 : 0;

    // Calculate detailed margins (approximate distribution from insurance amounts)
    const ingresos_repuestos = insuranceAmounts.total_spare_parts_eur || 0;
    const ingresos_mo_chapa = insuranceAmounts.bodywork_labor_eur || 0;
    const ingresos_mo_pintura = insuranceAmounts.painting_labor_eur || 0;
    const ingresos_mat_pintura = insuranceAmounts.paint_material_eur || 0;

    return {
      case_id: caseId,
      metadata: {
        matricula: vehicleData.license_plate || 'N/A',
        referencia: analysis.reference_number || 'N/A',
        fecha: analysis.created_at ? new Date(analysis.created_at).toLocaleDateString('es-ES') : 'N/A',
        taller: 'Taller' // TODO: Get from workshop data
      },
      ingresos_totales,
      costes_totales,
      margen_eur,
      margen_pct,
      margen_detallado: {
        repuestos: { 
          ingresos: ingresos_repuestos, 
          costes: costes_repuestos, 
          margen: ingresos_repuestos - costes_repuestos 
        },
        mo_chapa: { 
          ingresos: ingresos_mo_chapa, 
          costes: costes_mo_chapa, 
          margen: ingresos_mo_chapa - costes_mo_chapa 
        },
        mo_pintura: { 
          ingresos: ingresos_mo_pintura, 
          costes: costes_mo_pintura, 
          margen: ingresos_mo_pintura - costes_mo_pintura 
        },
        mat_pintura: { 
          ingresos: ingresos_mat_pintura, 
          costes: costes_mat_pintura, 
          margen: ingresos_mat_pintura - costes_mat_pintura 
        }
      }
    };
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

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium text-foreground">Cargando análisis de rentabilidad...</p>
            <p className="text-sm text-muted-foreground mt-2">Calculando márgenes y generando informe</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Error al cargar el análisis</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/app/nuevo">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No results state
  if (!results) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No se encontraron datos para este análisis.</p>
            <Link to="/app/nuevo" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  {(() => {
                    // Calcular rentabilidades para cada concepto
                    const conceptos = [
                      {
                        nombre: "M.O. Chapa",
                        descripcion: "excelente margen del",
                        rentabilidad: results.margen_detallado.mo_chapa.ingresos > 0 
                          ? (results.margen_detallado.mo_chapa.margen / results.margen_detallado.mo_chapa.ingresos) * 100 
                          : 0
                      },
                      {
                        nombre: "Materiales pintura",
                        descripcion: "rentabilidad del",
                        rentabilidad: results.margen_detallado.mat_pintura.ingresos > 0 
                          ? (results.margen_detallado.mat_pintura.margen / results.margen_detallado.mat_pintura.ingresos) * 100 
                          : 0
                      },
                      {
                        nombre: "M.O. Pintura",
                        descripcion: "margen del",
                        rentabilidad: results.margen_detallado.mo_pintura.ingresos > 0 
                          ? (results.margen_detallado.mo_pintura.margen / results.margen_detallado.mo_pintura.ingresos) * 100 
                          : 0
                      }
                    ];

                    // Ordenar por rentabilidad de mayor a menor
                    const conceptosOrdenados = conceptos.sort((a, b) => b.rentabilidad - a.rentabilidad);

                    return conceptosOrdenados.map((concepto, index) => (
                      <li key={index}>
                        • {concepto.nombre}: {concepto.descripcion} {formatPercentage(concepto.rentabilidad)}
                      </li>
                    ));
                  })()}
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