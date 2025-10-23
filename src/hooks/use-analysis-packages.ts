import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type AnalysisPackage = Tables<'analysis_packages'>;

export interface PackageWithSavings extends AnalysisPackage {
  savings: number;
  formattedPrice: string;
  formattedSavings: string;
}

export const useAnalysisPackages = () => {
  const [packages, setPackages] = useState<PackageWithSavings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener paquetes activos usando la función RPC
      const { data: packagesData, error: packagesError } = await supabase
        .rpc('get_active_packages');

      if (packagesError) {
        throw packagesError;
      }

      // Obtener el precio base de un análisis individual
      const { data: settingData, error: settingError } = await supabase
        .rpc('get_system_setting', { setting_name: 'additional_analysis_price' });

      if (settingError) {
        throw settingError;
      }

      const basePrice = settingData as number;

      // Calcular ahorros y formatear precios
      const packagesWithSavings: PackageWithSavings[] = (packagesData as AnalysisPackage[]).map(pkg => {
        const regularPrice = pkg.analyses_count * basePrice;
        const savings = regularPrice - pkg.total_price;
        
        return {
          ...pkg,
          savings,
          formattedPrice: `€${(pkg.total_price / 100).toFixed(2)}`,
          formattedSavings: `€${(savings / 100).toFixed(2)}`
        };
      });

      setPackages(packagesWithSavings);
    } catch (err) {
      console.error('Error fetching analysis packages:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages
  };
};