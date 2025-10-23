import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { Upload, FileText, AlertCircle, CheckCircle2, ArrowRight, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthlyUsage } from "@/hooks/use-monthly-usage";
import { useAnalysisBalance } from "@/hooks/use-analysis-balance";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useAnalysisPackages } from "@/hooks/use-analysis-packages";
import StripeIcon from "@/components/StripeIcon";

const NewAnalysis = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const { toast } = useToast();
  const { session, profile, workshop } = useAuth();
  const { usage: monthlyUsage, loading: usageLoading, canCreateAnalysis, getNextAnalysisCost, refreshUsage } = useMonthlyUsage();
  const { refreshBalance } = useAnalysisBalance();
  const { settings: systemSettings } = useSystemSettings();
  const { packages, loading: packagesLoading } = useAnalysisPackages();

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

    // Verificar si el usuario puede crear un análisis gratuito
    if (canCreateAnalysis()) {
      uploadFile(file);
    } else {
      // Mostrar modal de pago
      setShowPaymentModal(true);
    }
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      if (!selectedPackage) {
        throw new Error('Debe seleccionar un paquete');
      }

      // Pago de paquete
      const packageData = packages.find(pkg => pkg.id === selectedPackage);
      if (!packageData) {
        throw new Error('Paquete seleccionado no encontrado');
      }

      const paymentData = {
        currency: 'eur',
        package_id: selectedPackage,
        analyses_count: packageData.analyses_count,
        description: `Paquete: ${packageData.name} - ${packageData.analyses_count} análisis`,
        user_id: session?.user?.id
      };
      
      // Crear sesión de pago con Stripe
      console.log('Creating payment session with data:', paymentData);
      const { data, error } = await supabase.functions.invoke('payment-session', {
        body: paymentData
      });

      if (error) {
        throw new Error(`Error creando sesión de pago: ${error.message}`);
      }

      if (data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('Error procesando pago:', error);
      toast({
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "No se pudo procesar el pago.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      if (!session?.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      // PASO 1: Subir PDF a Supabase Storage
      console.log('Subiendo PDF a Supabase Storage...');
      
      const fileName = `${session.user.id}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('analysis-pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo PDF:', uploadError);
        throw new Error(`Error subiendo PDF: ${uploadError.message}`);
      }

      // PASO 2: Obtener URL firmada del PDF (válida por 1 año)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('analysis-pdfs')
        .createSignedUrl(fileName, 31536000); // 1 año en segundos

      if (urlError) {
        console.error('Error generando URL firmada:', urlError);
        // Si falla la generación de URL, eliminar el PDF subido
        await supabase.storage.from('analysis-pdfs').remove([fileName]);
        throw new Error(`Error generando URL del PDF: ${urlError.message}`);
      }

      const pdfUrl = urlData.signedUrl;
      console.log('PDF subido exitosamente:', pdfUrl);

      // Obtener workshop_id del perfil o del contexto, con fallback a consulta rápida
      let workshopId: string | null = profile?.workshop_id ?? workshop?.id ?? null;
      if (!workshopId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('workshop_id')
          .eq('id', session.user.id)
          .single();
        workshopId = (profData as any)?.workshop_id ?? null;
      }

      // PASO 3: Crear registro en analysis con status 'processing'
      const insertPayload: any = {
        user_id: session.user.id,
        status: 'processing',
        pdf_filename: file.name,
        pdf_url: pdfUrl,
      };
      // Incluir workshop_id explícitamente si lo tenemos; si no, el trigger lo rellenará
      if (workshopId) {
        insertPayload.workshop_id = workshopId;
      }

      const { data: analysis, error: analysisError } = await supabase
        .from('analysis')
        .insert(insertPayload)
        .select('*')
        .single();

      if (analysisError) {
        console.error('Error creando análisis:', analysisError);
        // Si falla la creación del análisis, eliminar el PDF subido
        await supabase.storage.from('analysis-pdfs').remove([fileName]);
        throw new Error(`Error creando análisis en base de datos: ${analysisError.message}`);
      }

      if (!analysis) {
        await supabase.storage.from('analysis-pdfs').remove([fileName]);
        throw new Error('No se pudo crear el análisis');
      }

      // Validar que workshop_id quedó asignado (por inserción directa o trigger)
      if (!analysis.workshop_id) {
        console.warn('workshop_id no se asignó en el insert; intentando actualizar desde perfil...');
        if (workshopId) {
          await supabase
            .from('analysis')
            .update({ workshop_id: workshopId })
            .eq('id', analysis.id);
        }
      }

      // PASO 4: Enviar archivo PDF a n8n para procesamiento (mantiene compatibilidad)
      console.log('Enviando archivo PDF a n8n...');
      
      const webhookUrl = 'https://bot-bitrix-n8n.uhcoic.easypanel.host/webhook/23154e6f-420b-4186-be36-8b7585da797a';
      
      const formData = new FormData();
      formData.append('file', file); // Enviar el archivo original como espera n8n
      formData.append('analysis_id', analysis.id);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Marcar análisis como fallido pero mantener PDF
        await supabase
          .from('analysis')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
        
        throw new Error(`Error en n8n: ${response.status} - ${errorText}`);
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
        
        // Marcar análisis como fallido
        await supabase
          .from('analysis')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
        
        throw new Error('No se pudo parsear la respuesta de n8n');
      }

      console.log('=== PARSED RESPONSE ===');
      console.log(JSON.stringify(result, null, 2));
      console.log('=======================');

      // N8N puede devolver un objeto o un array con un objeto
      let extractedData;
      if (Array.isArray(result)) {
        if (result.length === 0) {
          await supabase
            .from('analysis')
            .update({ status: 'failed' })
            .eq('id', analysis.id);
          throw new Error('N8N devolvió un array vacío');
        }
        extractedData = result[0];
      } else if (typeof result === 'object' && result !== null) {
        extractedData = result;
      } else {
        console.error('Result is not valid:', result);
        await supabase
          .from('analysis')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
        throw new Error('Respuesta de n8n no válida: ' + JSON.stringify(result));
      }

      console.log('=== EXTRACTED DATA ===');
      console.log(JSON.stringify(extractedData, null, 2));
      console.log('======================');

      const parseNumber = (str: string) => {
        if (!str) return null;
        const cleaned = str.replace(/[€\s.]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      // Extraer porcentaje de IVA de la respuesta de n8n
      const parseIvaPercentage = (ivaStr: string) => {
        if (!ivaStr) return 21; // Default 21% si no viene el dato
        const cleaned = ivaStr.replace('%', '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 21 : num;
      };

      const ivaPercentage = parseIvaPercentage(extractedData.iva);
      const ivaDecimal = ivaPercentage / 100;

      // Calcular subtotal sin IVA, IVA y total con IVA
      const repuestos = parseNumber(extractedData.repuestos_total) || 0;
      const moChapa = parseNumber(extractedData.mo_chapa_eur) || 0;
      const moPintura = parseNumber(extractedData.mo_pintura_eur) || 0;
      const matPintura = parseNumber(extractedData.mat_pintura_eur) || 0;
      
      const subtotalSinIva = repuestos + moChapa + moPintura + matPintura;
      const ivaAmount = subtotalSinIva * ivaDecimal;
      const totalConIva = subtotalSinIva + ivaAmount;

      console.log('=== CÁLCULOS IVA ===');
      console.log('IVA extraído de n8n:', extractedData.iva);
      console.log('IVA porcentaje:', ivaPercentage + '%');
      console.log('Repuestos:', repuestos);
      console.log('M.O. Chapa:', moChapa);
      console.log('M.O. Pintura:', moPintura);
      console.log('Mat. Pintura:', matPintura);
      console.log('Subtotal sin IVA:', subtotalSinIva);
      console.log(`IVA (${ivaPercentage}%):`, ivaAmount);
      console.log('Total con IVA:', totalConIva);
      console.log('===================');

      // Logs adicionales para debugging
      console.log('=== DEBUGGING DATOS EXTRAÍDOS ===');
      console.log('Analysis ID:', analysis.id);
      console.log('User ID:', session.user.id);
      console.log('Extracted Data Keys:', Object.keys(extractedData));
      console.log('Raw extracted data:', JSON.stringify(extractedData, null, 2));
      console.log('================================');

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

      // Preparar datos para insurance_amounts
      const insuranceData = {
        analysis_id: analysis.id,
        total_spare_parts_eur: parseNumber(extractedData.repuestos_total),
        bodywork_labor_ut: parseNumber(extractedData.mo_chapa_ut),
        bodywork_labor_eur: parseNumber(extractedData.mo_chapa_eur),
        painting_labor_ut: parseNumber(extractedData.mo_pintura_ut),
        painting_labor_eur: parseNumber(extractedData.mo_pintura_eur),
        paint_material_eur: parseNumber(extractedData.mat_pintura_eur),
        net_subtotal: subtotalSinIva,
        iva_amount: ivaAmount,
        total_with_iva: totalConIva,
        iva_percentage: ivaPercentage
      };

      console.log('=== DATOS PARA INSURANCE_AMOUNTS ===');
      console.log('Insurance Data:', JSON.stringify(insuranceData, null, 2));
      console.log('===================================');

      const { error: insuranceError } = await supabase
        .from('insurance_amounts')
        .insert(insuranceData);

      if (insuranceError) {
        console.error('Error guardando insurance_amounts:', insuranceError);
        throw new Error('Error guardando importes de la aseguradora');
      }

      // PASO 5: Procesar fecha_valoracion de n8n y marcar análisis como completado
      const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        
        // Intentar diferentes formatos de fecha
        const formats = [
          /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
          /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
          /^(\d{2})-(\d{2})-(\d{4})$/    // DD-MM-YYYY
        ];
        
        for (const format of formats) {
          const match = dateStr.match(format);
          if (match) {
            if (format === formats[0] || format === formats[2]) {
              // DD/MM/YYYY o DD-MM-YYYY
              const [, day, month, year] = match;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              // YYYY-MM-DD
              return dateStr;
            }
          }
        }
        
        console.warn('Formato de fecha no reconocido:', dateStr);
        return null;
      };

      const valuation_date = parseDate(extractedData.fecha_valoracion);
      
      console.log('=== PROCESANDO FECHA VALORACIÓN ===');
      console.log('fecha_valoracion de n8n:', extractedData.fecha_valoracion);
      console.log('valuation_date procesada:', valuation_date);
      console.log('==================================');

      const { error: updateError } = await supabase
        .from('analysis')
        .update({ 
          status: 'completed',
          valuation_date: valuation_date
        })
        .eq('id', analysis.id);

      if (updateError) {
        console.error('Error actualizando status:', updateError);
        // No lanzamos error aquí porque los datos ya están guardados
      }

      setIsUploading(false);

      toast({
        title: "PDF procesado exitosamente",
        description: "Los datos se han extraído y guardado correctamente.",
      });

      // Actualizar el balance de análisis después de completar exitosamente
      try {
        await refreshBalance();
        await refreshUsage(); // También actualizar el hook original por compatibilidad
      } catch (refreshError) {
        console.error('Error actualizando balance:', refreshError);
        // No mostramos error al usuario ya que el análisis se completó exitosamente
      }

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

  const handleSelectFileClick = () => {
    // Verificar si el usuario puede crear un análisis gratuito
    if (canCreateAnalysis()) {
      // Si puede, abrir el selector de archivos normalmente
      document.getElementById('file-input')?.click();
    } else {
      // Si no puede, mostrar directamente el modal de pago
      setShowPaymentModal(true);
    }
  };

  const handleCancelPayment = () => {
    // Cerrar el modal y limpiar cualquier archivo que pueda estar cargado
    setShowPaymentModal(false);
    setUploadedFile(null);
    setSelectedPackage(null);
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
                  onClick={handleSelectFileClick}
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

      {/* Modal de Pago */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => !open && handleCancelPayment()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Comprar Análisis</span>
            </DialogTitle>
            <DialogDescription>
              Has alcanzado el límite de análisis gratuitos para este mes. Elige una opción para continuar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {packagesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Cargando paquetes...</p>
              </div>
            ) : packages.length > 0 ? (
              <RadioGroup value={selectedPackage || ''} onValueChange={setSelectedPackage}>
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={pkg.id} id={pkg.id} />
                      <Label htmlFor={pkg.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{pkg.name}</h4>
                            {pkg.description && (
                              <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {pkg.analyses_count} análisis • €{(pkg.price_per_analysis / 100).toFixed(2)} por análisis
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{pkg.formattedPrice}</p>
                            {pkg.savings > 0 && (
                              <p className="text-sm text-green-600">
                                Ahorras {pkg.formattedSavings}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay paquetes disponibles en este momento.</p>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground border-t pt-4 space-y-1">
              <p>• Pago único con descuentos por volumen</p>
              <p>• Los análisis se añaden a tu balance</p>
              <p>• Ideal para uso frecuente</p>
              <p className="flex items-center">
                • El pago se procesará de forma segura a través de 
                <StripeIcon className="mx-1 h-4 w-4" size={16} />
                Stripe
              </p>
              <p>• Podrás continuar inmediatamente después del pago</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelPayment}
              disabled={isProcessingPayment}
            >
              Cancelar
            </Button>
            <Button 
              onClick={processPayment}
              disabled={isProcessingPayment || !selectedPackage}
              className="bg-gradient-primary text-primary-foreground"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Procesando...
                </>
              ) : (
                 <>
                   <StripeIcon className="mr-2 h-4 w-4" size={16} />
                   {selectedPackage ? (
                     `Pagar ${packages.find(p => p.id === selectedPackage)?.formattedPrice || '€0.00'}`
                   ) : (
                     'Selecciona un paquete'
                   )}
                 </>
               )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewAnalysis;