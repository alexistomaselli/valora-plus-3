#!/bin/bash

# Script de deployment para Easypanel
# Uso: ./deploy.sh [tag]

set -e

# Configuración
IMAGE_NAME="valora-plus-frontend"
REGISTRY="your-registry.com"  # Cambiar por tu registry
DEFAULT_TAG="latest"

# Obtener tag del argumento o usar default
TAG=${1:-$DEFAULT_TAG}
FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$TAG"

echo "🚀 Iniciando deployment de Valora Plus Frontend..."
echo "📦 Imagen: $FULL_IMAGE_NAME"

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker build -t $IMAGE_NAME:$TAG .
docker tag $IMAGE_NAME:$TAG $FULL_IMAGE_NAME

# Push al registry (opcional, comentado por defecto)
# echo "📤 Subiendo imagen al registry..."
# docker push $FULL_IMAGE_NAME

echo "✅ Build completado exitosamente!"
echo "🐳 Para ejecutar localmente:"
echo "   docker run -p 80:80 $IMAGE_NAME:$TAG"
echo ""
echo "=== CONFIGURACIÓN DE VARIABLES DE ENTORNO EN EASYPANEL ==="
echo "IMPORTANTE: Configura estas variables de entorno en Easypanel ANTES del deployment:"
echo ""
echo "Variables requeridas:"
echo "VITE_SUPABASE_URL=https://piynzvpnurnvbrmkyneo.supabase.co"
echo "VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeW56dnBudXJudmJybWt5bmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjk0MzMsImV4cCI6MjA3NTk0NTQzM30.OJH_xmSuTE6Q0Pen5rswn5VSUdSfARyvjCKDV_xVPfE"
echo "VITE_SUPABASE_PROJECT_ID=piynzvpnurnvbrmkyneo"
echo ""
echo "PASOS PARA CONFIGURAR EN EASYPANEL:"
echo "1. Ve a tu servicio en Easypanel"
echo "2. Haz clic en 'Environment Variables'"
echo "3. Agrega cada variable con su valor correspondiente"
echo "4. Guarda los cambios"
echo "5. Haz un nuevo deployment"
echo ""
echo "TROUBLESHOOTING:"
echo "- Si el build falla, verifica que las variables estén configuradas correctamente"
echo "- El build puede tomar 2-5 minutos, ten paciencia"
echo "- Si persiste el error, revisa los logs del build en Easypanel"
echo ""