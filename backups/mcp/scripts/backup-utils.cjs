#!/usr/bin/env node

/**
 * Utilidades para gestión de backups
 * Incluye funciones para limpiar, listar, restaurar y validar backups
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupUtils {
  constructor(backupDir = './backups') {
    this.backupDir = backupDir;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [BACKUP-UTILS] [${level.toUpperCase()}] ${message}`);
  }

  /**
   * Lista todos los backups disponibles
   */
  listBackups() {
    this.log('Listando backups disponibles...');
    
    if (!fs.existsSync(this.backupDir)) {
      this.log('Directorio de backups no existe', 'warn');
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (file.match(/^(mcp_backup_|valora_plus_complete_dump_).*\.(sql|tar\.gz)$/)) {
        const backup = {
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: file.endsWith('.tar.gz') ? 'compressed' : 'sql',
          sizeFormatted: this.formatBytes(stats.size)
        };
        
        // Intentar extraer timestamp del nombre
        const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}[T_]\d{2}[-:]\d{2}[-:]\d{2})/);
        if (timestampMatch) {
          backup.timestamp = timestampMatch[1];
        }
        
        backups.push(backup);
      }
    }

    // Ordenar por fecha de creación (más reciente primero)
    backups.sort((a, b) => b.created - a.created);

    this.log(`Encontrados ${backups.length} backups`);
    return backups;
  }

  /**
   * Muestra información detallada de los backups
   */
  showBackupInfo() {
    const backups = this.listBackups();
    
    if (backups.length === 0) {
      console.log('No se encontraron backups.');
      return;
    }

    console.log('\n=== BACKUPS DISPONIBLES ===\n');
    
    for (const backup of backups) {
      console.log(`Archivo: ${backup.filename}`);
      console.log(`Tamaño: ${backup.sizeFormatted}`);
      console.log(`Creado: ${backup.created.toISOString()}`);
      console.log(`Tipo: ${backup.type}`);
      
      // Buscar archivo de información asociado
      const infoFile = backup.filename.replace(/\.(sql|tar\.gz)$/, '_info.txt');
      const infoPath = path.join(this.backupDir, infoFile);
      
      if (fs.existsSync(infoPath)) {
        console.log(`Info: ${infoFile}`);
      }
      
      console.log('---');
    }
  }

  /**
   * Limpia backups antiguos basado en retención
   */
  cleanOldBackups(retentionDays = 30, maxBackups = 10) {
    this.log(`Limpiando backups antiguos (retención: ${retentionDays} días, máximo: ${maxBackups})`);
    
    const backups = this.listBackups();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
    
    let deletedCount = 0;
    let deletedSize = 0;

    // Eliminar por fecha
    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        this.log(`Eliminando backup antiguo: ${backup.filename}`);
        fs.unlinkSync(backup.path);
        
        // Eliminar archivo de info asociado
        const infoFile = backup.filename.replace(/\.(sql|tar\.gz)$/, '_info.txt');
        const infoPath = path.join(this.backupDir, infoFile);
        if (fs.existsSync(infoPath)) {
          fs.unlinkSync(infoPath);
        }
        
        deletedCount++;
        deletedSize += backup.size;
      }
    }

    // Eliminar exceso si hay más del máximo permitido
    const remainingBackups = this.listBackups();
    if (remainingBackups.length > maxBackups) {
      const toDelete = remainingBackups.slice(maxBackups);
      
      for (const backup of toDelete) {
        this.log(`Eliminando backup excedente: ${backup.filename}`);
        fs.unlinkSync(backup.path);
        
        const infoFile = backup.filename.replace(/\.(sql|tar\.gz)$/, '_info.txt');
        const infoPath = path.join(this.backupDir, infoFile);
        if (fs.existsSync(infoPath)) {
          fs.unlinkSync(infoPath);
        }
        
        deletedCount++;
        deletedSize += backup.size;
      }
    }

    this.log(`Limpieza completada: ${deletedCount} archivos eliminados, ${this.formatBytes(deletedSize)} liberados`);
    return { deletedCount, deletedSize };
  }

  /**
   * Valida la integridad de un backup
   */
  validateBackup(filename) {
    this.log(`Validando backup: ${filename}`);
    
    const filePath = path.join(this.backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup no encontrado: ${filename}`);
    }

    const stats = fs.statSync(filePath);
    const validation = {
      filename,
      exists: true,
      size: stats.size,
      readable: true,
      valid: true,
      errors: []
    };

    try {
      // Verificar si es legible
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      validation.readable = false;
      validation.valid = false;
      validation.errors.push('Archivo no legible');
    }

    // Validar archivo comprimido
    if (filename.endsWith('.tar.gz')) {
      try {
        execSync(`tar -tzf "${filePath}" > /dev/null 2>&1`);
        this.log('Archivo comprimido válido');
      } catch (error) {
        validation.valid = false;
        validation.errors.push('Archivo comprimido corrupto');
      }
    }

    // Validar archivo SQL
    if (filename.endsWith('.sql')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.length === 0) {
          validation.valid = false;
          validation.errors.push('Archivo SQL vacío');
        } else if (!content.includes('-- DUMP COMPLETO')) {
          validation.errors.push('Formato de dump no reconocido');
        }
      } catch (error) {
        validation.valid = false;
        validation.errors.push('Error leyendo archivo SQL');
      }
    }

    if (validation.valid) {
      this.log('Backup válido');
    } else {
      this.log(`Backup inválido: ${validation.errors.join(', ')}`, 'error');
    }

    return validation;
  }

  /**
   * Extrae un backup comprimido
   */
  extractBackup(filename, extractDir = null) {
    this.log(`Extrayendo backup: ${filename}`);
    
    if (!filename.endsWith('.tar.gz')) {
      throw new Error('Solo se pueden extraer archivos .tar.gz');
    }

    const filePath = path.join(this.backupDir, filename);
    const targetDir = extractDir || path.join(this.backupDir, 'extracted');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      execSync(`tar -xzf "${filePath}" -C "${targetDir}"`);
      this.log(`Backup extraído en: ${targetDir}`);
      return targetDir;
    } catch (error) {
      this.log(`Error extrayendo backup: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Genera un reporte de backups
   */
  generateReport() {
    this.log('Generando reporte de backups...');
    
    const backups = this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const oldestBackup = backups.length > 0 ? backups[backups.length - 1] : null;
    const newestBackup = backups.length > 0 ? backups[0] : null;

    const report = {
      timestamp: new Date().toISOString(),
      backupDirectory: this.backupDir,
      totalBackups: backups.length,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      oldestBackup: oldestBackup ? {
        filename: oldestBackup.filename,
        created: oldestBackup.created,
        age: this.getAge(oldestBackup.created)
      } : null,
      newestBackup: newestBackup ? {
        filename: newestBackup.filename,
        created: newestBackup.created,
        age: this.getAge(newestBackup.created)
      } : null,
      backups: backups.map(backup => ({
        filename: backup.filename,
        size: backup.sizeFormatted,
        created: backup.created,
        type: backup.type,
        age: this.getAge(backup.created)
      }))
    };

    const reportFile = path.join(this.backupDir, `backup_report_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`Reporte generado: ${reportFile}`);
    return report;
  }

  /**
   * Formatea bytes en formato legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calcula la edad de un archivo
   */
  getAge(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} días`;
    } else if (diffHours > 0) {
      return `${diffHours} horas`;
    } else {
      return 'menos de 1 hora';
    }
  }

  /**
   * Compara dos backups
   */
  compareBackups(filename1, filename2) {
    this.log(`Comparando backups: ${filename1} vs ${filename2}`);
    
    const backup1 = this.listBackups().find(b => b.filename === filename1);
    const backup2 = this.listBackups().find(b => b.filename === filename2);
    
    if (!backup1 || !backup2) {
      throw new Error('Uno o ambos backups no encontrados');
    }

    const comparison = {
      backup1: {
        filename: backup1.filename,
        size: backup1.sizeFormatted,
        created: backup1.created
      },
      backup2: {
        filename: backup2.filename,
        size: backup2.sizeFormatted,
        created: backup2.created
      },
      sizeDifference: backup2.size - backup1.size,
      timeDifference: backup2.created - backup1.created,
      newer: backup2.created > backup1.created ? backup2.filename : backup1.filename
    };

    this.log('Comparación completada');
    return comparison;
  }
}

// Función principal para uso desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const utils = new BackupUtils();

  switch (command) {
    case 'list':
      utils.showBackupInfo();
      break;
      
    case 'clean':
      const retentionDays = parseInt(args[1]) || 30;
      const maxBackups = parseInt(args[2]) || 10;
      utils.cleanOldBackups(retentionDays, maxBackups);
      break;
      
    case 'validate':
      if (!args[1]) {
        console.error('Uso: node backup-utils.js validate <filename>');
        process.exit(1);
      }
      const validation = utils.validateBackup(args[1]);
      console.log(JSON.stringify(validation, null, 2));
      break;
      
    case 'extract':
      if (!args[1]) {
        console.error('Uso: node backup-utils.js extract <filename> [extractDir]');
        process.exit(1);
      }
      utils.extractBackup(args[1], args[2]);
      break;
      
    case 'report':
      const report = utils.generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'compare':
      if (!args[1] || !args[2]) {
        console.error('Uso: node backup-utils.js compare <filename1> <filename2>');
        process.exit(1);
      }
      const comparison = utils.compareBackups(args[1], args[2]);
      console.log(JSON.stringify(comparison, null, 2));
      break;
      
    default:
      console.log(`
Utilidades de Backup - Valora Plus

Uso: node backup-utils.js <comando> [opciones]

Comandos disponibles:
  list                           Lista todos los backups
  clean [días] [máximo]         Limpia backups antiguos (default: 30 días, 10 máximo)
  validate <filename>           Valida la integridad de un backup
  extract <filename> [dir]      Extrae un backup comprimido
  report                        Genera reporte de backups
  compare <file1> <file2>       Compara dos backups

Ejemplos:
  node backup-utils.js list
  node backup-utils.js clean 15 5
  node backup-utils.js validate mcp_backup_2024-01-01.tar.gz
  node backup-utils.js extract mcp_backup_2024-01-01.tar.gz ./temp
  node backup-utils.js report
      `);
  }
}

// Exportar la clase para uso como módulo
module.exports = BackupUtils;

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}