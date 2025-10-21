import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MonthlyUsage {
  totalAnalyses: number;
  freeAnalysesUsed: number;
  paidAnalysesCount: number;
  freeAnalysesLimit: number;
  remainingFreeAnalyses: number;
  totalAmountDue: number;
  paymentStatus: string;
  year: number;
  month: number;
}

export const useMonthlyUsage = () => {
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el uso mensual actual del usuario
      const { data, error } = await supabase.rpc('get_current_monthly_usage');

      if (error) throw error;

      if (data) {
        const usageData = data as any; // Cast para acceder a las propiedades
        const formattedUsage: MonthlyUsage = {
          totalAnalyses: usageData.total_analyses || 0,
          freeAnalysesUsed: usageData.free_analyses_used || 0,
          paidAnalysesCount: usageData.paid_analyses_count || 0,
          freeAnalysesLimit: usageData.free_analyses_limit || 3,
          remainingFreeAnalyses: usageData.remaining_free_analyses || 0,
          totalAmountDue: usageData.total_amount_due || 0,
          paymentStatus: usageData.payment_status || 'pending',
          year: usageData.year || new Date().getFullYear(),
          month: usageData.month || new Date().getMonth() + 1
        };

        setUsage(formattedUsage);
      }
    } catch (err) {
      console.error('Error fetching monthly usage:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudo cargar el uso mensual",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = () => {
    return fetchUsage();
  };

  // Función para verificar si el usuario puede crear un análisis gratuito
  const canCreateAnalysis = () => {
    if (!usage) return false;
    
    // Solo puede crear análisis gratuitos si tiene análisis gratuitos disponibles
    return usage.remainingFreeAnalyses > 0;
  };

  // Función para obtener el costo del próximo análisis
  // Implementación alternativa que no usa la función Edge
  const getNextAnalysisCost = async () => {
    try {
      console.log('getNextAnalysisCost - usage inicial:', usage);
      // Si no hay datos de uso, intentar obtenerlos
      if (!usage) {
        console.log('No hay usage, obteniendo...');
        await fetchUsage();
      }
      
      // Si aún no hay datos de uso, devolver 0
      if (!usage) {
        console.log('Aún no hay usage después de fetchUsage');
        return 0;
      }
      
      // Obtener el precio adicional de system_settings
      const { data: additionalPrice } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'additional_analysis_price')
        .single();
        
      // Obtener si el billing está habilitado
      const { data: billingEnabled } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'billing_enabled')
        .single();
      
      const isBillingEnabled = (billingEnabled?.setting_value as any)?.value === true;
      const price = (additionalPrice?.setting_value as any)?.value || 0;
      
      console.log('Configuración:', {
        additionalPrice: additionalPrice?.setting_value,
        billingEnabled: billingEnabled?.setting_value,
        isBillingEnabled,
        price,
        remainingFreeAnalyses: usage.remainingFreeAnalyses
      });
      
      // Determinar si el próximo análisis es gratuito
      const isNextAnalysisFree = usage.remainingFreeAnalyses > 0;
      
      // Calcular el costo
      let cost = 0;
      if (!isNextAnalysisFree && isBillingEnabled) {
        cost = price;
      }
      
      console.log('Cálculo final:', { isNextAnalysisFree, isBillingEnabled, cost });
      return cost;
    } catch (err) {
      console.error('Error calculando el costo del próximo análisis:', err);
      return 0;
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    loading,
    error,
    refreshUsage,
    canCreateAnalysis,
    getNextAnalysisCost
  };
};