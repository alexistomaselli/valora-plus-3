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
echo "📋 Para deployment en Easypanel:"
echo "   1. Sube el código a tu repositorio Git"
echo "   2. En Easypanel, crea una nueva aplicación"
echo "   3. Conecta tu repositorio Git"
echo "   4. Easypanel detectará automáticamente el Dockerfile"
echo "   5. Configura el puerto 80 en la configuración de la app"