#!/bin/bash

# Aliases útiles para el sistema de backups
# Fuente: source backups/mcp/scripts/backup-aliases.sh

alias backup-full='node backups/mcp/scripts/mcp-backup.cjs'
alias backup-structure='node backups/mcp/scripts/mcp-backup.cjs --no-data'
alias backup-data='node backups/mcp/scripts/mcp-backup.cjs --no-structure --no-functions --no-rls --no-triggers --no-indexes --no-constraints'
alias backup-list='node backups/mcp/scripts/backup-utils.cjs list'
alias backup-clean='node backups/mcp/scripts/backup-utils.cjs clean'
alias backup-status='node backups/mcp/scripts/backup-scheduler.cjs status'
alias backup-help='node backups/mcp/scripts/mcp-backup.cjs --help'

echo "✅ Aliases de backup cargados:"
echo "  backup-full      - Backup completo"
echo "  backup-structure - Solo estructura"
echo "  backup-data      - Solo datos"
echo "  backup-list      - Listar backups"
echo "  backup-clean     - Limpiar backups"
echo "  backup-status    - Estado de programaciones"
echo "  backup-help      - Mostrar ayuda"
