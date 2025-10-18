#!/bin/bash

# Script de Instalación del Sistema de Backups MCP
# Configura automáticamente el sistema de backups para Valora Plus

set -e

echo "🚀 INSTALACIÓN DEL SISTEMA DE BACKUPS MCP"
echo "========================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

log "Verificando directorio del proyecto..."
PROJECT_DIR=$(pwd)
MCP_DIR="$PROJECT_DIR/backups/mcp"
SCRIPTS_DIR="$MCP_DIR/scripts"
BACKUPS_DIR="$PROJECT_DIR/backups"

# Crear directorios necesarios
log "Creando directorios necesarios..."

if [ ! -d "$SCRIPTS_DIR" ]; then
    mkdir -p "$SCRIPTS_DIR"
    log "Directorio scripts/ creado"
fi

if [ ! -d "$BACKUPS_DIR" ]; then
    mkdir -p "$BACKUPS_DIR"
    log "Directorio backups/ creado"
fi

# Verificar Node.js
log "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js detectado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Dar permisos de ejecución a los scripts
log "Configurando permisos de ejecución..."
chmod +x "$SCRIPTS_DIR"/*.cjs 2>/dev/null || true
chmod +x "$SCRIPTS_DIR"/*.sh 2>/dev/null || true

log "Permisos configurados para scripts"

# Verificar configuración
log "Verificando configuración..."

CONFIG_FILE="$SCRIPTS_DIR/backup-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    warn "Archivo de configuración no encontrado"
    info "Se usará la configuración por defecto"
else
    log "Archivo de configuración encontrado: $CONFIG_FILE"
fi

# Verificar crontab
log "Verificando crontab..."
if ! command -v crontab &> /dev/null; then
    warn "crontab no está disponible. Los backups programados no funcionarán."
else
    log "crontab disponible para backups programados"
fi

# Verificar tar
log "Verificando tar para compresión..."
if ! command -v tar &> /dev/null; then
    warn "tar no está disponible. La compresión de backups no funcionará."
else
    log "tar disponible para compresión"
fi

# Crear archivo .gitignore para backups si no existe
GITIGNORE_FILE="$BACKUPS_DIR/.gitignore"
if [ ! -f "$GITIGNORE_FILE" ]; then
    log "Creando .gitignore para directorio de backups..."
    cat > "$GITIGNORE_FILE" << EOF
# Ignorar todos los archivos de backup
*.sql
*.tar.gz
*.json
*.txt
*.log

# Excepto este .gitignore
!.gitignore
EOF
    log ".gitignore creado en directorio de backups"
fi

# Crear script de inicio rápido
QUICK_START="$SCRIPTS_DIR/quick-backup.sh"
if [ ! -f "$QUICK_START" ]; then
    log "Creando script de inicio rápido..."
    cat > "$QUICK_START" << 'EOF'
#!/bin/bash

# Script de Inicio Rápido para Backups
# Ejecuta un backup completo con configuración por defecto

echo "🚀 Ejecutando backup rápido..."
cd "$(dirname "$0")/../../.."
node backups/mcp/scripts/mcp-backup.cjs

echo "✅ Backup completado!"
echo "📁 Archivos guardados en: ./backups/"
echo "📋 Para más opciones: node backups/mcp/scripts/mcp-backup.cjs --help"
EOF
    chmod +x "$QUICK_START"
    log "Script de inicio rápido creado: $QUICK_START"
fi

# Crear script de limpieza
CLEANUP_SCRIPT="$SCRIPTS_DIR/cleanup-backups.sh"
if [ ! -f "$CLEANUP_SCRIPT" ]; then
    log "Creando script de limpieza..."
    cat > "$CLEANUP_SCRIPT" << 'EOF'
#!/bin/bash

# Script de Limpieza de Backups
# Elimina backups antiguos automáticamente

echo "🧹 Limpiando backups antiguos..."
cd "$(dirname "$0")/../../.."

# Limpiar backups más antiguos de 30 días, mantener máximo 10
node backups/mcp/scripts/backup-utils.cjs clean 30 10

echo "✅ Limpieza completada!"
EOF
    chmod +x "$CLEANUP_SCRIPT"
    log "Script de limpieza creado: $CLEANUP_SCRIPT"
fi

# Verificar archivos del sistema
log "Verificando archivos del sistema de backups..."

REQUIRED_FILES=(
    "scripts/mcp-backup.cjs"
    "scripts/mcp-client.cjs"
    "scripts/backup-utils.cjs"
    "scripts/backup-scheduler.cjs"
    "config/backup-config.json"
    "docs/README-BACKUP.md"
    "examples/backup-example.cjs"
  )

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$MCP_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    warn "Archivos faltantes detectados:"
    for file in "${MISSING_FILES[@]}"; do
        warn "  - $file"
    done
    info "Algunos archivos del sistema pueden estar faltando"
else
    log "Todos los archivos del sistema están presentes"
fi

# Crear alias útiles en un archivo de configuración
ALIASES_FILE="$SCRIPTS_DIR/backup-aliases.sh"
if [ ! -f "$ALIASES_FILE" ]; then
    log "Creando aliases útiles..."
    cat > "$ALIASES_FILE" << 'EOF'
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
EOF
    chmod +x "$ALIASES_FILE"
    log "Aliases creados: $ALIASES_FILE"
fi

# Mostrar resumen de instalación
echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================"
echo ""
info "Directorios creados:"
info "  📁 $MCP_DIR (sistema MCP)"
info "  📁 $SCRIPTS_DIR (scripts del sistema)"
info "  📁 $BACKUPS_DIR (archivos de backup)"
echo ""
info "Scripts disponibles:"
info "  🚀 quick-backup.sh      - Backup rápido"
info "  🧹 cleanup-backups.sh   - Limpieza automática"
info "  ⚙️  backup-aliases.sh    - Aliases útiles"
echo ""
info "Comandos principales:"
info "  node backups/mcp/scripts/mcp-backup.cjs              - Backup completo"
  info "  node backups/mcp/scripts/backup-utils.cjs list       - Listar backups"
  info "  node backups/mcp/scripts/backup-scheduler.cjs status - Estado de programaciones"
echo ""
info "Documentación:"
info "  📖 backups/mcp/docs/README-BACKUP.md - Documentación completa"
info "  🔧 backups/mcp/examples/backup-example.cjs - Ejemplos de uso"
echo ""

# Verificar configuración del proyecto
CONFIG_FILE="$MCP_DIR/config/backup-config.json"
if [ -f "$CONFIG_FILE" ]; then
    PROJECT_REF=$(grep -o '"projectRef": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    if [ "$PROJECT_REF" = "piynzvpnurnvbrmkyneo" ]; then
        warn "⚠️  IMPORTANTE: Actualiza el projectRef en backup-config.json"
        warn "   Archivo: $CONFIG_FILE"
        warn "   Cambia 'piynzvpnurnvbrmkyneo' por tu project reference real"
    else
        log "✅ Project reference configurado: $PROJECT_REF"
    fi
fi

echo ""
info "🎯 PRÓXIMOS PASOS:"
info "1. Editar backups/mcp/config/backup-config.json con tu configuración"
info "2. Ejecutar: ./backups/mcp/scripts/quick-backup.sh (para probar)"
info "3. Configurar backups programados: node backups/mcp/scripts/backup-scheduler.cjs enable daily 02:00"
  info "4. Instalar cron jobs: node backups/mcp/scripts/backup-scheduler.cjs setup"
echo ""
log "🎉 Sistema de backups MCP instalado correctamente!"
echo ""