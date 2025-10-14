import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const NewAnalysis = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor, sube únicamente archivos PDF.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 20MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      if (!session?.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const formData = new FormData();
      formData.append('file', file);

      const webhookUrl = 'https://bot-bitrix-n8n.uhcoic.easypanel.host/webhook/23154e6f-420b-4186-be36-8b7585da797a';

      console.log('Enviando PDF a n8n...');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('=== RAW RESPONSE ===');
      console.log(responseText);
      console.log('====================');

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('No se pudo parsear la respuesta de n8n');
      }

      console.log('=== PARSED RESPONSE ===');
      console.log(JSON.stringify(result, null, 2));
      console.log('Type:', typeof result);
      console.log('Is Array:', Array.isArray(result));
      console.log('=======================');

      // N8N puede devolver un objeto o un array con un objeto
      let extractedData;
      if (Array.isArray(result)) {
        if (result.length === 0) {
          throw new Error('N8N devolvió un array vacío');
        }
        extractedData = result[0];
      } else if (typeof result === 'object' && result !== null) {
        extractedData = result;
      } else {
        console.error('Result is not valid:', result);
        throw new Error('Respuesta de n8n no válida: ' + JSON.stringify(result));
      }

      console.log('=== EXTRACTED DATA ===');
      console.log(JSON.stringify(extractedData, null, 2));
      console.log('======================');

      const { data: analysis, error: analysisError } = await supabase
        .from('analysis')
        .insert({
          user_id: session.user.id,
          status: 'completed',
          pdf_filename: file.name
        })
        .select()
        .single();

      if (analysisError || !analysis) {
        throw new Error('Error creando análisis en base de datos');
      }

      const parseNumber = (str: string) => {
        if (!str) return null;
        const cleaned = str.replace(/[€\s.]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const { error: vehicleError } = await supabase
        .from('vehicle_data')
        .insert({
          analysis_id: analysis.id,
          license_plate: extractedData.matricula || null,
          vin: extractedData.bastidor || null,
          manufacturer: extractedData.fabricante || null,
          model: extractedData.modelo || null,
          internal_reference: extractedData.referencia || null,
          system: extractedData.sistema || null,
          hourly_price: parseNumber(extractedData.precio_hora)
        });

      if (vehicleError) {
        console.error('Error guardando vehicle_data:', vehicleError);
        throw new Error('Error guardando datos del vehículo');
      }

      const { error: insuranceError } = await supabase
        .from('insurance_amounts')
        .insert({
          analysis_id: analysis.id,
          total_spare_parts_eur: parseNumber(extractedData.repuestos_total),
          bodywork_labor_ut: parseNumber(extractedData.mo_chapa_ut),
          bodywork_labor_eur: parseNumber(extractedData.mo_chapa_eur),
          painting_labor_ut: parseNumber(extractedData.mo_pintura_ut),
          painting_labor_eur: parseNumber(extractedData.mo_pintura_eur),
          paint_material_eur: parseNumber(extractedData.mat_pintura_eur)
        });

      if (insuranceError) {
        console.error('Error guardando insurance_amounts:', insuranceError);
        throw new Error('Error guardando importes de la aseguradora');
      }

      setIsUploading(false);

      toast({
        title: "PDF procesado exitosamente",
        description: "Los datos se han extraído y guardado correctamente.",
      });

      setTimeout(() => {
        window.location.href = `/app/verificacion/${analysis.id}`;
      }, 1000);

    } catch (error) {
      setIsUploading(false);
      console.error('Upload error:', error);
      toast({
        title: "Error al subir PDF",
        description: error instanceof Error ? error.message : "No se pudo procesar el archivo.",
        variant: "destructive"
      });
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Nuevo Análisis de Rentabilidad
        </h1>
        <p className="text-lg text-muted-foreground">
          Sube la valoración PDF de la aseguradora para comenzar
        </p>
      </div>

      {/* Upload Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Subir PDF de Valoración</span>
          </CardTitle>
          <CardDescription>
            Formatos compatibles: Audatex, GT Motive, Solera. Tamaño máximo: 20MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
                dragActive 
                  ? "border-primary bg-primary-soft shadow-glow" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={cn(
                  "p-4 rounded-full transition-colors",
                  dragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Arrastra tu PDF aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF de valoración de Audatex, GT Motive o Solera
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Seleccionar Archivo
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isUploading ? (
                    <div className="flex items-center space-x-2 text-primary">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm">Procesando...</span>
                    </div>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={removeFile}
                    disabled={isUploading}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-warning mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Datos que extraemos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Total repuestos y materiales</li>
                  <li>• Horas de mano de obra (chapa/pintura)</li>
                  <li>• Precios por hora de trabajo</li>
                  <li>• Materiales de pintura</li>
                  <li>• Datos del vehículo (matrícula, bastidor)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-6 w-6 text-success mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Proceso automático</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Reconocimiento OCR si es necesario</li>
                  <li>• Validación de coherencia de datos</li>
                  <li>• Verificación manual opcional</li>
                  <li>• Cálculo instantáneo de márgenes</li>
                  <li>• Informe PDF automático</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      {uploadedFile && !isUploading && (
        <Card className="bg-primary-soft border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">¡Perfecto!</h3>
                <p className="text-sm text-primary/80">
                  Tu PDF se ha procesado correctamente. Continúa al siguiente paso.
                </p>
              </div>
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                Verificar Datos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewAnalysis;