#!/bin/bash

# Script de Inicio Rápido para Backups
# Ejecuta un backup completo con configuración por defecto

echo "🚀 Ejecutando backup rápido..."
cd "$(dirname "$0")/../../.."
node backups/mcp/scripts/mcp-backup.cjs

echo "✅ Backup completado!"
echo "📁 Archivos guardados en: ./backups/"
echo "📋 Para más opciones: node backups/mcp/scripts/mcp-backup.cjs --help"
