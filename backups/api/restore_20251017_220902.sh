#!/bin/bash

# Script de restauración para el backup del 20251017_220902
# 
# IMPORTANTE: Este script restaura solo los datos, no la estructura
# Asegúrate de que las tablas existan antes de ejecutar

echo "🔄 Iniciando restauración del backup del 20251017_220902"

# Cargar variables de entorno
if [ -f ../../.env ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
else
    echo "Error: No se encontró el archivo .env"
    exit 1
fi

# Lista de archivos de backup
echo "📋 Restaurando tabla: profiles"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @profiles_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/profiles"

echo "📋 Restaurando tabla: workshops"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @workshops_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/workshops"

echo "📋 Restaurando tabla: analysis"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @analysis_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/analysis"

echo "📋 Restaurando tabla: vehicle_data"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @vehicle_data_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/vehicle_data"

echo "📋 Restaurando tabla: insurance_amounts"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @insurance_amounts_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/insurance_amounts"

echo "📋 Restaurando tabla: workshop_costs"
# curl -X POST \
#     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
#     -H "Content-Type: application/json" \
#     -d @workshop_costs_20251017_220902.json \
#     "$VITE_SUPABASE_URL/rest/v1/workshop_costs"

echo "✅ Restauración completada"
