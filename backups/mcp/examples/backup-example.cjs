#!/usr/bin/env node

/**
 * Ejemplo de Uso del Sistema de Backups MCP
 * Demuestra cómo usar las diferentes funcionalidades del sistema
 */

const MCPBackup = require('../scripts/mcp-backup.cjs');
const BackupUtils = require('../scripts/backup-utils.cjs');
const BackupScheduler = require('../scripts/backup-scheduler.cjs');

async function ejemploBackupCompleto() {
  console.log('=== EJEMPLO: BACKUP COMPLETO ===\n');
  
  try {
    // Configuración personalizada
    const config = {
      projectRef: 'piynzvpnurnvbrmkyneo',
      backupDir: './backups',
      includeData: true,
      includeStructure: true,
      includeFunctions: true,
      includeRLS: true,
      includeTriggers: true,
      includeIndexes: true,
      includeConstraints: true,
      compress: true,
      verbose: true
    };
    
    console.log('Configuración del backup:');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    
    // Crear instancia de backup
    const backup = new MCPBackup(config);
    
    // Ejecutar backup
    console.log('Ejecutando backup completo...');
    const result = await backup.run();
    
    console.log('Backup completado exitosamente!');
    console.log('Archivos generados:', result);
    
  } catch (error) {
    console.error('Error en backup completo:', error.message);
  }
}

async function ejemploBackupEstructura() {
  console.log('\n=== EJEMPLO: BACKUP SOLO ESTRUCTURA ===\n');
  
  try {
    const config = {
      projectRef: 'piynzvpnurnvbrmkyneo',
      backupDir: './backups',
      includeData: false,        // Solo estructura
      includeStructure: true,
      includeFunctions: true,
      includeRLS: true,
      includeTriggers: true,
      includeIndexes: true,
      includeConstraints: true,
      compress: true,
      verbose: true
    };
    
    const backup = new MCPBackup(config);
    const result = await backup.run();
    
    console.log('Backup de estructura completado!');
    console.log('Archivos generados:', result);
    
  } catch (error) {
    console.error('Error en backup de estructura:', error.message);
  }
}

function ejemploGestionBackups() {
  console.log('\n=== EJEMPLO: GESTIÓN DE BACKUPS ===\n');
  
  const utils = new BackupUtils('./backups');
  
  // Listar backups
  console.log('Listando backups disponibles:');
  const backups = utils.listBackups();
  
  if (backups.length === 0) {
    console.log('No se encontraron backups.');
    return;
  }
  
  console.log(`Encontrados ${backups.length} backups:`);
  for (const backup of backups.slice(0, 3)) { // Mostrar solo los primeros 3
    console.log(`- ${backup.filename} (${backup.sizeFormatted}, ${backup.type})`);
  }
  
  // Validar el backup más reciente
  if (backups.length > 0) {
    console.log('\nValidando backup más reciente...');
    const validation = utils.validateBackup(backups[0].filename);
    console.log(`Validación: ${validation.valid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    
    if (!validation.valid) {
      console.log('Errores encontrados:', validation.errors);
    }
  }
  
  // Generar reporte
  console.log('\nGenerando reporte de backups...');
  const report = utils.generateReport();
  console.log(`Total de backups: ${report.totalBackups}`);
  console.log(`Espacio total usado: ${report.totalSizeFormatted}`);
  
  if (report.newestBackup) {
    console.log(`Backup más reciente: ${report.newestBackup.filename} (${report.newestBackup.age})`);
  }
}

function ejemploProgramacionBackups() {
  console.log('\n=== EJEMPLO: PROGRAMACIÓN DE BACKUPS ===\n');
  
  const scheduler = new BackupScheduler();
  
  // Mostrar estado actual
  console.log('Estado actual de programaciones:');
  scheduler.showStatus();
  
  // Ejemplo de configuración de programaciones
  console.log('\nEjemplo de configuración:');
  
  try {
    // Habilitar backup diario
    console.log('Habilitando backup diario a las 2:30 AM...');
    scheduler.enableSchedule('daily', '02:30', 'full');
    
    // Habilitar backup semanal
    console.log('Habilitando backup semanal los domingos a las 3:00 AM...');
    scheduler.enableSchedule('weekly', '03:00', 'full', 'sunday');
    
    // Mostrar estado actualizado
    console.log('\nEstado después de la configuración:');
    scheduler.showStatus();
    
    console.log('\nPara instalar los trabajos cron, ejecuta:');
    console.log('node backups/mcp/scripts/backup-scheduler.cjs setup');
    
  } catch (error) {
    console.error('Error configurando programaciones:', error.message);
  }
}

async function ejemploBackupPersonalizado() {
  console.log('\n=== EJEMPLO: BACKUP PERSONALIZADO ===\n');
  
  try {
    // Backup personalizado para desarrollo
    const configDev = {
      projectRef: 'piynzvpnurnvbrmkyneo',
      backupDir: './backups/dev',
      includeData: true,
      includeStructure: true,
      includeFunctions: false,    // Sin funciones para desarrollo
      includeRLS: false,          // Sin RLS para desarrollo
      includeTriggers: false,     // Sin triggers para desarrollo
      includeIndexes: true,
      includeConstraints: true,
      compress: false,            // Sin comprimir para desarrollo
      verbose: true
    };
    
    console.log('Configuración para desarrollo:');
    console.log('- Incluye: estructura, datos, índices, constraints');
    console.log('- Excluye: funciones, RLS, triggers');
    console.log('- Sin compresión para fácil acceso');
    console.log('');
    
    const backupDev = new MCPBackup(configDev);
    const result = await backupDev.run();
    
    console.log('Backup de desarrollo completado!');
    console.log('Archivos generados:', result);
    
  } catch (error) {
    console.error('Error en backup personalizado:', error.message);
  }
}

function ejemploLimpiezaBackups() {
  console.log('\n=== EJEMPLO: LIMPIEZA DE BACKUPS ===\n');
  
  const utils = new BackupUtils('./backups');
  
  // Mostrar backups antes de la limpieza
  const backupsAntes = utils.listBackups();
  console.log(`Backups antes de la limpieza: ${backupsAntes.length}`);
  
  // Limpiar backups antiguos (más de 7 días, máximo 3)
  console.log('Limpiando backups antiguos (más de 7 días, máximo 3)...');
  const resultado = utils.cleanOldBackups(7, 3);
  
  console.log(`Archivos eliminados: ${resultado.deletedCount}`);
  console.log(`Espacio liberado: ${utils.formatBytes(resultado.deletedSize)}`);
  
  // Mostrar backups después de la limpieza
  const backupsDespues = utils.listBackups();
  console.log(`Backups después de la limpieza: ${backupsDespues.length}`);
}

function mostrarAyuda() {
  console.log(`
=== EJEMPLOS DE USO DEL SISTEMA DE BACKUPS MCP ===

Este script demuestra diferentes formas de usar el sistema de backups.

Uso: node backups/mcp/examples/backup-example.cjs [comando]

Comandos disponibles:
  completo        Ejecuta un backup completo con todos los elementos
  estructura      Ejecuta un backup solo de estructura (sin datos)
  gestion         Demuestra gestión de backups (listar, validar, reportes)
  programacion    Demuestra configuración de backups programados
  personalizado   Ejecuta un backup con configuración personalizada
  limpieza        Demuestra limpieza de backups antiguos
  todo            Ejecuta todos los ejemplos (excepto limpieza)

Ejemplos:
  node backups/mcp/examples/backup-example.cjs completo
node backups/mcp/examples/backup-example.cjs estructura
node backups/mcp/examples/backup-example.cjs gestion
node backups/mcp/examples/backup-example.cjs todo

Nota: Los ejemplos usan configuración de demostración.
      Ajusta el projectRef en el código para tu proyecto real.
  `);
}

// Función principal
async function main() {
  const comando = process.argv[2];
  
  console.log('🚀 SISTEMA DE BACKUPS MCP - EJEMPLOS DE USO\n');
  
  switch (comando) {
    case 'completo':
      await ejemploBackupCompleto();
      break;
      
    case 'estructura':
      await ejemploBackupEstructura();
      break;
      
    case 'gestion':
      ejemploGestionBackups();
      break;
      
    case 'programacion':
      ejemploProgramacionBackups();
      break;
      
    case 'personalizado':
      await ejemploBackupPersonalizado();
      break;
      
    case 'limpieza':
      ejemploLimpiezaBackups();
      break;
      
    case 'todo':
      await ejemploBackupCompleto();
      await ejemploBackupEstructura();
      ejemploGestionBackups();
      ejemploProgramacionBackups();
      await ejemploBackupPersonalizado();
      // No incluir limpieza en 'todo' para evitar eliminar backups
      break;
      
    default:
      mostrarAyuda();
  }
  
  console.log('\n✅ Ejemplos completados!');
  console.log('\nPara más información, consulta: backups/mcp/docs/README-BACKUP.md');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error ejecutando ejemplos:', error.message);
    process.exit(1);
  });
}

module.exports = {
  ejemploBackupCompleto,
  ejemploBackupEstructura,
  ejemploGestionBackups,
  ejemploProgramacionBackups,
  ejemploBackupPersonalizado,
  ejemploLimpiezaBackups
};