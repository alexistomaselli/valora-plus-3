# 📦 Backup de Supabase - Guía de Uso

Este directorio contiene backups completos de la base de datos Supabase de producción, incluyendo datos, estructura y configuración.

## 📁 Estructura de Archivos

### Backups Completos
- `supabase_complete_backup_YYYYMMDD_HHMMSS.tar.gz` - Archivo comprimido con backup completo
- `complete_YYYYMMDD_HHMMSS/` - Directorio descomprimido con todos los archivos

### Backups Individuales
- `api/` - Backups individuales via API de Supabase
- `migrations_backup_*.tar.gz` - Solo las migraciones SQL

## 🚀 Cómo Usar el Backup

### 1. Extraer el Backup Completo

```bash
# Extraer el archivo comprimido más reciente
tar -xzf supabase_complete_backup_YYYYMMDD_HHMMSS.tar.gz

# Navegar al directorio extraído
cd complete_YYYYMMDD_HHMMSS/
```

### 2. Leer las Instrucciones Detalladas

```bash
# Ver información completa del backup
cat backup_info.txt
```

### 3. Restaurar en una Nueva Instancia

#### Opción A: Restauración Automática
```bash
# Ejecutar el script de restauración
./restore_YYYYMMDD_HHMMSS.sh
```

#### Opción B: Restauración Manual

**Paso 1: Restaurar Estructura (Migraciones)**
```bash
# Extraer migraciones
tar -xzf migrations.tar.gz

# Aplicar migraciones en orden en tu nueva instancia de Supabase
# (Usar Supabase Dashboard o CLI)
```

**Paso 2: Restaurar Datos**
```bash
# Usar archivos JSON individuales para cada tabla:
# - workshops_YYYYMMDD_HHMMSS.json
# - profiles_YYYYMMDD_HHMMSS.json
# - analysis_YYYYMMDD_HHMMSS.json
# - vehicle_data_YYYYMMDD_HHMMSS.json
# - insurance_amounts_YYYYMMDD_HHMMSS.json
# - workshop_costs_YYYYMMDD_HHMMSS.json

# O usar el backup consolidado SQL
# consolidated_backup_YYYYMMDD_HHMMSS.sql
```

**Paso 3: Configurar Variables de Entorno**
```bash
# Copiar configuración base
cp .env.example /ruta/a/tu/proyecto/.env

# Editar con tus credenciales de la nueva instancia
# VITE_SUPABASE_URL=tu_nueva_url
# VITE_SUPABASE_PUBLISHABLE_KEY=tu_nueva_key
```

## 🛠️ Scripts Disponibles

### Scripts de Backup
- `../scripts/backup-via-api.sh` - Backup individual via API
- `../scripts/complete-backup.sh` - Backup completo automatizado

### Scripts de Restauración
- `restore_YYYYMMDD_HHMMSS.sh` - Restauración automática de datos

## 📊 Contenido del Backup

### Datos (formato JSON)
- **workshops** - Información de talleres registrados
- **profiles** - Perfiles de usuarios
- **analysis** - Análisis de vehículos realizados
- **vehicle_data** - Datos extraídos de vehículos
- **insurance_amounts** - Importes de seguros
- **workshop_costs** - Costes de talleres

### Estructura de Base de Datos
- **migrations.tar.gz** - Todas las migraciones SQL en orden
- **consolidated_backup.sql** - Backup consolidado con DELETE + INSERT

### Configuración
- **config.toml** - Configuración de Supabase
- **.env.example** - Plantilla de variables de entorno

## 🔒 Consideraciones de Seguridad

⚠️ **IMPORTANTE**: 
- Los backups contienen datos sensibles de producción
- NO incluyen contraseñas ni claves API por seguridad
- Guárdalos en un lugar seguro
- No los compartas públicamente
- Considera cifrarlos para almacenamiento a largo plazo

## 🔄 Automatización de Backups

### Backup Manual
```bash
# Desde el directorio raíz del proyecto
./scripts/complete-backup.sh
```

### Backup Programado (Recomendado)
```bash
# Agregar a crontab para backup diario a las 2:00 AM
0 2 * * * cd /ruta/a/tu/proyecto && ./scripts/complete-backup.sh

# Backup semanal con limpieza de archivos antiguos
0 2 * * 0 cd /ruta/a/tu/proyecto && ./scripts/complete-backup.sh && find backups/ -name "*.tar.gz" -mtime +30 -delete
```

## 🧪 Pruebas de Restauración

Se recomienda probar el proceso de restauración periódicamente:

1. **Crear instancia de prueba** en Supabase
2. **Restaurar backup** usando los scripts
3. **Verificar datos** y funcionalidad
4. **Documentar problemas** encontrados

## 📞 Soporte

Si encuentras problemas durante la restauración:

1. Verifica que las credenciales sean correctas
2. Revisa los logs de error en la consola
3. Asegúrate de que la instancia de destino esté vacía
4. Verifica que las políticas RLS estén configuradas correctamente

## 📈 Mejores Prácticas

- **Backup regular**: Ejecuta backups antes de cambios importantes
- **Versionado**: Mantén múltiples versiones de backup
- **Pruebas**: Verifica regularmente que los backups funcionen
- **Documentación**: Mantén este README actualizado
- **Almacenamiento**: Considera almacenamiento externo para backups críticos

---

*Última actualización: $(date)*
*Generado automáticamente por el sistema de backup de Supabase*