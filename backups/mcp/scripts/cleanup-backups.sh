#!/bin/bash

# Script de Limpieza de Backups
# Elimina backups antiguos automáticamente

echo "🧹 Limpiando backups antiguos..."
cd "$(dirname "$0")/../../.."

# Limpiar backups más antiguos de 30 días, mantener máximo 10
node backups/mcp/scripts/backup-utils.cjs clean 30 10

echo "✅ Limpieza completada!"
