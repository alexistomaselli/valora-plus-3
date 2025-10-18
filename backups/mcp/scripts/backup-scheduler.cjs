#!/usr/bin/env node

/**
 * Programador de Backups Automáticos
 * Permite configurar y gestionar backups programados usando cron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const MCPBackup = require('./mcp-backup.cjs');
const BackupUtils = require('./backup-utils.cjs');

class BackupScheduler {
  constructor(configFile = '../config/backup-config.json') {
    this.configFile = configFile;
    this.config = this.loadConfig();
    this.cronFile = '/tmp/valora-plus-backup-cron';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SCHEDULER] [${level.toUpperCase()}] ${message}`);
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const content = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.log(`Error cargando configuración: ${error.message}`, 'error');
    }
    
    // Configuración por defecto
    return {
      default: {
        projectRef: 'piynzvpnurnvbrmkyneo',
        backupDir: './backups',
        compress: true,
        verbose: true
      },
      schedules: {
        daily: { enabled: false, time: '02:00', profile: 'full' },
        weekly: { enabled: false, time: '03:00', day: 'sunday', profile: 'full' },
        monthly: { enabled: false, time: '04:00', day: 1, profile: 'full' }
      }
    };
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
      this.log('Configuración guardada');
    } catch (error) {
      this.log(`Error guardando configuración: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Ejecuta un backup con el perfil especificado
   */
  async runBackup(profileName = 'full') {
    this.log(`Ejecutando backup con perfil: ${profileName}`);
    
    try {
      const profile = this.config.profiles?.[profileName] || this.config.default;
      const backupConfig = { ...this.config.default, ...profile };
      
      const backup = new MCPBackup(backupConfig);
      const result = await backup.run();
      
      // Limpiar backups antiguos después del backup exitoso
      const utils = new BackupUtils(backupConfig.backupDir);
      utils.cleanOldBackups(
        this.config.default.retentionDays || 30,
        this.config.default.maxBackups || 10
      );
      
      this.log('Backup programado completado exitosamente');
      
      // Enviar notificaciones si están configuradas
      await this.sendNotification('success', {
        profile: profileName,
        result: result,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      this.log(`Error en backup programado: ${error.message}`, 'error');
      
      await this.sendNotification('error', {
        profile: profileName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Configura los trabajos cron
   */
  setupCronJobs() {
    this.log('Configurando trabajos cron...');
    
    const cronJobs = [];
    const scriptPath = path.resolve(__dirname, 'backup-scheduler.cjs');
    
    // Backup diario
    if (this.config.schedules.daily?.enabled) {
      const time = this.config.schedules.daily.time.split(':');
      const minute = time[1] || '0';
      const hour = time[0] || '2';
      const profile = this.config.schedules.daily.profile || 'full';
      
      cronJobs.push(`${minute} ${hour} * * * cd ${process.cwd()} && node "${scriptPath}" run ${profile} >> /tmp/valora-backup-daily.log 2>&1`);
    }
    
    // Backup semanal
    if (this.config.schedules.weekly?.enabled) {
      const time = this.config.schedules.weekly.time.split(':');
      const minute = time[1] || '0';
      const hour = time[0] || '3';
      const day = this.getDayNumber(this.config.schedules.weekly.day || 'sunday');
      const profile = this.config.schedules.weekly.profile || 'full';
      
      cronJobs.push(`${minute} ${hour} * * ${day} cd ${process.cwd()} && node "${scriptPath}" run ${profile} >> /tmp/valora-backup-weekly.log 2>&1`);
    }
    
    // Backup mensual
    if (this.config.schedules.monthly?.enabled) {
      const time = this.config.schedules.monthly.time.split(':');
      const minute = time[1] || '0';
      const hour = time[0] || '4';
      const day = this.config.schedules.monthly.day || 1;
      const profile = this.config.schedules.monthly.profile || 'full';
      
      cronJobs.push(`${minute} ${hour} ${day} * * cd ${process.cwd()} && node "${scriptPath}" run ${profile} >> /tmp/valora-backup-monthly.log 2>&1`);
    }
    
    if (cronJobs.length === 0) {
      this.log('No hay trabajos cron habilitados');
      return;
    }
    
    // Escribir archivo cron temporal
    const cronContent = cronJobs.join('\n') + '\n';
    fs.writeFileSync(this.cronFile, cronContent);
    
    try {
      // Instalar trabajos cron
      execSync(`crontab "${this.cronFile}"`);
      this.log(`${cronJobs.length} trabajos cron instalados`);
      
      // Limpiar archivo temporal
      fs.unlinkSync(this.cronFile);
      
    } catch (error) {
      this.log(`Error instalando cron jobs: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Elimina todos los trabajos cron de backup
   */
  removeCronJobs() {
    this.log('Eliminando trabajos cron...');
    
    try {
      // Obtener crontab actual
      let currentCron = '';
      try {
        currentCron = execSync('crontab -l', { encoding: 'utf8' });
      } catch (error) {
        // No hay crontab existente
        this.log('No hay crontab existente');
        return;
      }
      
      // Filtrar líneas que no sean de backup
      const lines = currentCron.split('\n');
      const filteredLines = lines.filter(line => 
        !line.includes('backup-scheduler.cjs') && 
        !line.includes('valora-backup') &&
        line.trim() !== ''
      );
      
      // Reinstalar crontab filtrado
      const newCronContent = filteredLines.join('\n') + (filteredLines.length > 0 ? '\n' : '');
      fs.writeFileSync(this.cronFile, newCronContent);
      execSync(`crontab "${this.cronFile}"`);
      fs.unlinkSync(this.cronFile);
      
      this.log('Trabajos cron de backup eliminados');
      
    } catch (error) {
      this.log(`Error eliminando cron jobs: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Muestra el estado de los trabajos programados
   */
  showStatus() {
    console.log('\n=== ESTADO DE BACKUPS PROGRAMADOS ===\n');
    
    const schedules = this.config.schedules;
    
    console.log('Configuración actual:');
    console.log(`- Proyecto: ${this.config.default.projectRef}`);
    console.log(`- Directorio: ${this.config.default.backupDir}`);
    console.log(`- Retención: ${this.config.default.retentionDays || 30} días`);
    console.log(`- Máximo backups: ${this.config.default.maxBackups || 10}`);
    console.log('');
    
    console.log('Programaciones:');
    
    if (schedules.daily?.enabled) {
      console.log(`✓ Diario: ${schedules.daily.time} (perfil: ${schedules.daily.profile})`);
    } else {
      console.log('✗ Diario: Deshabilitado');
    }
    
    if (schedules.weekly?.enabled) {
      console.log(`✓ Semanal: ${schedules.weekly.day} a las ${schedules.weekly.time} (perfil: ${schedules.weekly.profile})`);
    } else {
      console.log('✗ Semanal: Deshabilitado');
    }
    
    if (schedules.monthly?.enabled) {
      console.log(`✓ Mensual: Día ${schedules.monthly.day} a las ${schedules.monthly.time} (perfil: ${schedules.monthly.profile})`);
    } else {
      console.log('✗ Mensual: Deshabilitado');
    }
    
    console.log('');
    
    // Mostrar próximas ejecuciones
    this.showNextRuns();
  }

  /**
   * Calcula y muestra las próximas ejecuciones
   */
  showNextRuns() {
    console.log('Próximas ejecuciones:');
    
    const now = new Date();
    const nextRuns = [];
    
    if (this.config.schedules.daily?.enabled) {
      const next = this.getNextRun('daily', now);
      nextRuns.push({ type: 'Diario', date: next });
    }
    
    if (this.config.schedules.weekly?.enabled) {
      const next = this.getNextRun('weekly', now);
      nextRuns.push({ type: 'Semanal', date: next });
    }
    
    if (this.config.schedules.monthly?.enabled) {
      const next = this.getNextRun('monthly', now);
      nextRuns.push({ type: 'Mensual', date: next });
    }
    
    if (nextRuns.length === 0) {
      console.log('- No hay ejecuciones programadas');
    } else {
      nextRuns.sort((a, b) => a.date - b.date);
      for (const run of nextRuns) {
        console.log(`- ${run.type}: ${run.date.toLocaleString()}`);
      }
    }
  }

  /**
   * Calcula la próxima ejecución de un tipo de backup
   */
  getNextRun(type, from = new Date()) {
    const schedule = this.config.schedules[type];
    const [hour, minute] = schedule.time.split(':').map(Number);
    
    let next = new Date(from);
    next.setHours(hour, minute, 0, 0);
    
    switch (type) {
      case 'daily':
        if (next <= from) {
          next.setDate(next.getDate() + 1);
        }
        break;
        
      case 'weekly':
        const targetDay = this.getDayNumber(schedule.day);
        const currentDay = next.getDay();
        let daysUntil = targetDay - currentDay;
        
        if (daysUntil < 0 || (daysUntil === 0 && next <= from)) {
          daysUntil += 7;
        }
        
        next.setDate(next.getDate() + daysUntil);
        break;
        
      case 'monthly':
        next.setDate(schedule.day);
        if (next <= from) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
    }
    
    return next;
  }

  /**
   * Convierte nombre de día a número
   */
  getDayNumber(dayName) {
    const days = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName.toLowerCase()] || 0;
  }

  /**
   * Envía notificaciones
   */
  async sendNotification(type, data) {
    const notifications = this.config.notifications;
    
    if (!notifications) return;
    
    const message = type === 'success' 
      ? `Backup completado exitosamente (perfil: ${data.profile})`
      : `Error en backup (perfil: ${data.profile}): ${data.error}`;
    
    // Email (placeholder)
    if (notifications.email?.enabled && 
        ((type === 'success' && notifications.email.onSuccess) ||
         (type === 'error' && notifications.email.onError))) {
      this.log(`Enviando email: ${message}`);
      // Aquí iría la implementación de email
    }
    
    // Webhook (placeholder)
    if (notifications.webhook?.enabled &&
        ((type === 'success' && notifications.webhook.onSuccess) ||
         (type === 'error' && notifications.webhook.onError))) {
      this.log(`Enviando webhook: ${message}`);
      // Aquí iría la implementación de webhook
    }
  }

  /**
   * Habilita un tipo de backup programado
   */
  enableSchedule(type, time, profile = 'full', day = null) {
    if (!this.config.schedules[type]) {
      throw new Error(`Tipo de programación no válido: ${type}`);
    }
    
    this.config.schedules[type].enabled = true;
    this.config.schedules[type].time = time;
    this.config.schedules[type].profile = profile;
    
    if (day !== null) {
      this.config.schedules[type].day = day;
    }
    
    this.saveConfig();
    this.log(`Programación ${type} habilitada: ${time} (perfil: ${profile})`);
  }

  /**
   * Deshabilita un tipo de backup programado
   */
  disableSchedule(type) {
    if (!this.config.schedules[type]) {
      throw new Error(`Tipo de programación no válido: ${type}`);
    }
    
    this.config.schedules[type].enabled = false;
    this.saveConfig();
    this.log(`Programación ${type} deshabilitada`);
  }
}

// Función principal para uso desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const scheduler = new BackupScheduler();

  try {
    switch (command) {
      case 'run':
        const profile = args[1] || 'full';
        await scheduler.runBackup(profile);
        break;
        
      case 'setup':
        scheduler.setupCronJobs();
        break;
        
      case 'remove':
        scheduler.removeCronJobs();
        break;
        
      case 'status':
        scheduler.showStatus();
        break;
        
      case 'enable':
        const type = args[1];
        const time = args[2];
        const enableProfile = args[3] || 'full';
        const day = args[4];
        
        if (!type || !time) {
          console.error('Uso: node backup-scheduler.cjs enable <tipo> <hora> [perfil] [día]');
          process.exit(1);
        }
        
        scheduler.enableSchedule(type, time, enableProfile, day);
        break;
        
      case 'disable':
        const disableType = args[1];
        
        if (!disableType) {
          console.error('Uso: node backup-scheduler.js disable <tipo>');
          process.exit(1);
        }
        
        scheduler.disableSchedule(disableType);
        break;
        
      default:
        console.log(`
Programador de Backups - Valora Plus

Uso: node backup-scheduler.cjs <comando> [opciones]

Comandos disponibles:
  run [perfil]                  Ejecuta un backup inmediatamente
  setup                         Instala trabajos cron programados
  remove                        Elimina todos los trabajos cron
  status                        Muestra estado de programaciones
  enable <tipo> <hora> [perfil] [día]  Habilita programación
  disable <tipo>                Deshabilita programación

Tipos de programación:
  daily                         Backup diario
  weekly                        Backup semanal
  monthly                       Backup mensual

Ejemplos:
  node backup-scheduler.cjs run full
  node backup-scheduler.cjs enable daily 02:30 full
  node backup-scheduler.cjs enable weekly 03:00 full sunday
  node backup-scheduler.cjs enable monthly 04:00 full 1
  node backup-scheduler.cjs setup
  node backup-scheduler.cjs status
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Exportar la clase para uso como módulo
module.exports = BackupScheduler;

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}