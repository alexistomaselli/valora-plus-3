# Sistema de Backups MCP - Valora Plus

Sistema completo de backups automatizados para el proyecto Valora Plus usando MCP (Model Context Protocol) para conectar con Supabase.

## 📁 Estructura de Archivos

```
backups/mcp/
├── scripts/
│   ├── mcp-backup.cjs         # Script principal de backup
  ├── mcp-client.cjs         # Cliente MCP para conexión
  ├── backup-utils.cjs       # Utilidades de gestión
  └── backup-scheduler.cjs   # Programador de backups
├── config/
│   ├── backup-config.json     # Configuración
│   └── .env.backup.example    # Variables de entorno
├── docs/
│   └── README-BACKUP.md       # Esta documentación
├── examples/
│   └── backup-example.cjs     # Ejemplos de uso
└── install-backup-system.sh   # Script de instalación
```

## 🚀 Instalación y Configuración

### 1. Instalación Automática

```bash
./backups/mcp/install-backup-system.sh
```

### 2. Instalación Manual

#### Permisos de Ejecución

```bash
chmod +x backups/mcp/scripts/mcp-backup.cjs
chmod +x backups/mcp/scripts/backup-utils.cjs
chmod +x backups/mcp/scripts/backup-scheduler.cjs
```

#### Configuración Inicial

Edita el archivo `backups/mcp/config/backup-config.json` con tu configuración:

```json
{
  "default": {
    "projectRef": "tu-project-ref-aqui",
    "backupDir": "./backups",
    "retentionDays": 30,
    "maxBackups": 10
  }
}
```

## 📋 Uso Básico

### Backup Manual

```bash
# Backup completo
node backups/mcp/scripts/mcp-backup.cjs

# Backup con opciones específicas
node backups/mcp/scripts/mcp-backup.cjs --project-ref abc123 --backup-dir ./my-backups

# Backup solo estructura (sin datos)
node backups/mcp/scripts/mcp-backup.cjs --no-data

# Backup sin comprimir
node backups/mcp/scripts/mcp-backup.cjs --no-compress
```

### Gestión de Backups

```bash
# Listar backups disponibles
node backups/mcp/scripts/backup-utils.cjs list

# Limpiar backups antiguos (más de 15 días, máximo 5)
node backups/mcp/scripts/backup-utils.cjs clean 15 5

# Validar integridad de un backup
node backups/mcp/scripts/backup-utils.cjs validate mcp_backup_2024-01-01.tar.gz

# Extraer backup comprimido
node backups/mcp/scripts/backup-utils.cjs extract mcp_backup_2024-01-01.tar.gz

# Generar reporte de backups
node backups/mcp/scripts/backup-utils.cjs report
```

### Backups Programados

```bash
# Ver estado de programaciones
node backups/mcp/scripts/backup-scheduler.cjs status

# Habilitar backup diario a las 2:30 AM
node backups/mcp/scripts/backup-scheduler.cjs enable daily 02:30 full

# Habilitar backup semanal los domingos a las 3:00 AM
node backups/mcp/scripts/backup-scheduler.cjs enable weekly 03:00 full sunday

# Habilitar backup mensual el día 1 a las 4:00 AM
node backups/mcp/scripts/backup-scheduler.cjs enable monthly 04:00 full 1

# Instalar trabajos cron
node backups/mcp/scripts/backup-scheduler.cjs setup

# Eliminar todos los trabajos cron
node backups/mcp/scripts/backup-scheduler.cjs remove

# Ejecutar backup inmediato
node backups/mcp/scripts/backup-scheduler.cjs run full
```

## ⚙️ Configuración Avanzada

### Perfiles de Backup

El archivo `backup-config.json` incluye varios perfiles predefinidos:

- **full**: Backup completo con todos los elementos
- **structure-only**: Solo estructura, sin datos
- **data-only**: Solo datos, sin estructura
- **minimal**: Backup mínimo - solo tablas principales

### Programaciones

```json
{
  "schedules": {
    "daily": {
      "enabled": true,
      "time": "02:00",
      "profile": "full"
    },
    "weekly": {
      "enabled": true,
      "time": "03:00",
      "day": "sunday",
      "profile": "full"
    },
    "monthly": {
      "enabled": true,
      "time": "04:00",
      "day": 1,
      "profile": "full"
    }
  }
}
```

### Notificaciones

```json
{
  "notifications": {
    "email": {
      "enabled": false,
      "recipients": ["admin@example.com"],
      "onSuccess": true,
      "onError": true
    },
    "webhook": {
      "enabled": false,
      "url": "https://hooks.slack.com/...",
      "onSuccess": true,
      "onError": true
    }
  }
}
```

## 📊 Contenido de los Backups

Cada backup incluye:

### Estructura de Base de Datos
- ✅ Definiciones de tablas
- ✅ Tipos de datos y constraints
- ✅ Claves primarias y foráneas
- ✅ Índices únicos y compuestos

### Datos
- ✅ Todos los registros de las tablas
- ✅ Formato SQL INSERT compatible
- ✅ Manejo de valores NULL y caracteres especiales

### Funciones PostgreSQL
- ✅ Funciones definidas por el usuario
- ✅ Procedimientos almacenados
- ✅ Triggers y funciones de trigger

### Políticas RLS (Row Level Security)
- ✅ Políticas de seguridad a nivel de fila
- ✅ Condiciones de acceso y modificación
- ✅ Roles y permisos asociados

### Triggers
- ✅ Triggers de inserción, actualización y eliminación
- ✅ Triggers de auditoría y validación
- ✅ Configuración de timing (BEFORE/AFTER)

### Índices
- ✅ Índices simples y compuestos
- ✅ Índices únicos y parciales
- ✅ Índices de texto completo

### Constraints
- ✅ Constraints de integridad referencial
- ✅ Constraints de verificación (CHECK)
- ✅ Constraints de unicidad

## 🔧 Opciones de Línea de Comandos

### mcp-backup.cjs

```
Opciones:
  --project-ref <ref>     Project reference de Supabase
  --backup-dir <dir>      Directorio de destino para backups
  --no-data              No incluir datos de tablas
  --no-structure         No incluir estructura de tablas
  --no-functions         No incluir funciones PostgreSQL
  --no-rls               No incluir políticas RLS
  --no-triggers          No incluir triggers
  --no-indexes           No incluir índices
  --no-constraints       No incluir constraints
  --no-compress          No comprimir el backup
  --quiet                Modo silencioso
  --help                 Mostrar ayuda
```

### backup-utils.cjs

```
Comandos:
  list                           Lista todos los backups
  clean [días] [máximo]         Limpia backups antiguos
  validate <filename>           Valida la integridad de un backup
  extract <filename> [dir]      Extrae un backup comprimido
  report                        Genera reporte de backups
  compare <file1> <file2>       Compara dos backups
```

### backup-scheduler.cjs

```
Comandos:
  run [perfil]                  Ejecuta un backup inmediatamente
  setup                         Instala trabajos cron programados
  remove                        Elimina todos los trabajos cron
  status                        Muestra estado de programaciones
  enable <tipo> <hora> [perfil] [día]  Habilita programación
  disable <tipo>                Deshabilita programación
```

## 📁 Estructura de Archivos Generados

```
backups/
├── mcp_backup_2024-01-01T02-00-00.sql      # Archivo SQL del backup
├── mcp_backup_2024-01-01T02-00-00.json     # Datos estructurados en JSON
├── mcp_backup_2024-01-01T02-00-00_info.txt # Información del backup
└── mcp_backup_2024-01-01T02-00-00.tar.gz   # Archivo comprimido (si está habilitado)
```

### Archivo de Información

Cada backup incluye un archivo `_info.txt` con:
- Fecha y hora de generación
- Configuración utilizada
- Estadísticas (número de tablas, registros, etc.)
- Instrucciones de restauración
- Notas de seguridad

## 🔄 Restauración de Backups

### Desde Archivo SQL

```bash
# Extraer backup comprimido
tar -xzf mcp_backup_2024-01-01.tar.gz

# Restaurar en PostgreSQL
psql -h localhost -U usuario -d base_datos -f mcp_backup_2024-01-01.sql
```

### Desde Supabase Dashboard

1. Acceder al Dashboard de Supabase
2. Ir a Settings > Database
3. Usar la opción "Restore from backup"
4. Subir el archivo SQL generado

## 🛡️ Seguridad

### Consideraciones Importantes

- ⚠️ Los backups contienen datos sensibles de producción
- 🔒 Mantener archivos de backup en ubicaciones seguras
- 🚫 No compartir backups sin autorización
- 🔐 Considerar cifrado para backups almacenados externamente

### Buenas Prácticas

1. **Rotación de Backups**: Configurar retención adecuada
2. **Validación Regular**: Verificar integridad de backups
3. **Pruebas de Restauración**: Probar restauración periódicamente
4. **Monitoreo**: Configurar alertas para fallos de backup
5. **Almacenamiento Externo**: Considerar almacenamiento en la nube

## 🐛 Solución de Problemas

### Errores Comunes

#### Error de Conexión MCP
```
Error: Cliente MCP no conectado
```
**Solución**: Verificar configuración del project reference y conectividad.

#### Error de Permisos
```
Error: Permission denied
```
**Solución**: Verificar permisos de escritura en el directorio de backups.

#### Error de Espacio en Disco
```
Error: No space left on device
```
**Solución**: Limpiar backups antiguos o aumentar espacio disponible.

#### Error de Cron
```
Error instalando cron jobs
```
**Solución**: Verificar que el usuario tenga permisos para modificar crontab.

### Logs y Debugging

Los logs se almacenan en:
- `/tmp/valora-backup-daily.log` - Logs de backups diarios
- `/tmp/valora-backup-weekly.log` - Logs de backups semanales
- `/tmp/valora-backup-monthly.log` - Logs de backups mensuales

Para debugging, usar el modo verbose:
```bash
node backups/mcp/scripts/mcp-backup.cjs --verbose
```

## 📈 Monitoreo y Métricas

### Métricas Importantes

- **Tiempo de Ejecución**: Duración de cada backup
- **Tamaño de Backup**: Tamaño de archivos generados
- **Tasa de Éxito**: Porcentaje de backups exitosos
- **Espacio Utilizado**: Espacio total usado por backups

### Alertas Recomendadas

1. **Fallo de Backup**: Alerta inmediata si falla un backup
2. **Backup Tardío**: Alerta si un backup no se ejecuta a tiempo
3. **Espacio Bajo**: Alerta cuando quede poco espacio
4. **Backup Corrupto**: Alerta si la validación falla

## 🔄 Actualizaciones y Mantenimiento

### Actualizaciones del Sistema

1. Hacer backup de la configuración actual
2. Actualizar scripts
3. Probar en entorno de desarrollo
4. Actualizar configuración si es necesario
5. Reinstalar trabajos cron

### Mantenimiento Regular

- **Semanal**: Verificar logs de backups
- **Mensual**: Validar integridad de backups
- **Trimestral**: Probar restauración completa
- **Anual**: Revisar y actualizar configuración

## 📞 Soporte

Para problemas o preguntas:

1. Revisar logs de error
2. Consultar esta documentación
3. Verificar configuración
4. Probar en modo verbose
5. Contactar al equipo de desarrollo

## 📄 Licencia

Este sistema de backups es parte del proyecto Valora Plus y está sujeto a la misma licencia del proyecto principal.