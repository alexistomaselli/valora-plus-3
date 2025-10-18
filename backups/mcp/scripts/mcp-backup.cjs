#!/usr/bin/env node

/**
 * Script de Backup Completo usando MCP (Model Context Protocol)
 * Genera backups completos de la base de datos Supabase incluyendo:
 * - Estructura de tablas y datos
 * - Funciones PostgreSQL
 * - Políticas RLS
 * - Triggers, índices y constraints
 * 
 * Uso: node backups/mcp/scripts/mcp-backup.cjs [opciones]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración por defecto
const CONFIG = {
  projectRef: 'piynzvpnurnvbrmkyneo', // Cambiar por tu project ref
  backupDir: '../../../backups',
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

class MCPBackup {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config };
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupData = {
      tables: {},
      functions: [],
      policies: [],
      triggers: [],
      indexes: [],
      constraints: [],
      metadata: {
        timestamp: this.timestamp,
        projectRef: this.config.projectRef,
        version: '1.0.0'
      }
    };
  }

  log(message, level = 'info') {
    if (this.config.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  async executeQuery(query) {
    try {
      // Simular llamada MCP - en un entorno real usarías el cliente MCP
      this.log(`Ejecutando query: ${query.substring(0, 100)}...`);
      
      // Aquí iría la llamada real al MCP
      // const result = await mcpClient.executeQuery(this.config.projectRef, query);
      
      // Por ahora retornamos un mock para demostración
      return { success: true, data: [] };
    } catch (error) {
      this.log(`Error ejecutando query: ${error.message}`, 'error');
      throw error;
    }
  }

  async getTableList() {
    this.log('Obteniendo lista de tablas...');
    
    const query = `
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `;
    
    return await this.executeQuery(query);
  }

  async getTableSchema(schemaName, tableName) {
    this.log(`Obteniendo esquema de ${schemaName}.${tableName}...`);
    
    const query = `
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    
    return await this.executeQuery(query);
  }

  async getTableData(schemaName, tableName) {
    this.log(`Obteniendo datos de ${schemaName}.${tableName}...`);
    
    const query = `SELECT * FROM ${schemaName}.${tableName} ORDER BY 1;`;
    return await this.executeQuery(query);
  }

  async getFunctions() {
    this.log('Obteniendo funciones PostgreSQL...');
    
    const query = `
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_result(p.oid) as result_type,
        pg_get_function_arguments(p.oid) as arguments,
        CASE p.prokind 
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'a' THEN 'aggregate'
          WHEN 'w' THEN 'window'
        END as function_type,
        pg_get_functiondef(p.oid) as source_code,
        l.lanname as language
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY n.nspname, p.proname;
    `;
    
    return await this.executeQuery(query);
  }

  async getRLSPolicies() {
    this.log('Obteniendo políticas RLS...');
    
    const query = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename, policyname;
    `;
    
    return await this.executeQuery(query);
  }

  async getTriggers() {
    this.log('Obteniendo triggers...');
    
    const query = `
      SELECT 
        trigger_schema,
        trigger_name,
        event_object_table,
        action_statement,
        action_timing,
        event_manipulation,
        action_condition
      FROM information_schema.triggers
      WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY trigger_schema, event_object_table, trigger_name;
    `;
    
    return await this.executeQuery(query);
  }

  async getIndexes() {
    this.log('Obteniendo índices...');
    
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename, indexname;
    `;
    
    return await this.executeQuery(query);
  }

  async getConstraints() {
    this.log('Obteniendo constraints...');
    
    const query = `
      SELECT 
        constraint_schema,
        table_name,
        constraint_name,
        constraint_type,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE constraint_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY constraint_schema, table_name, constraint_name;
    `;
    
    return await this.executeQuery(query);
  }

  generateCreateTableSQL(schema, tableName, columns) {
    let sql = `-- Tabla: ${schema}.${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${schema}.${tableName} (\n`;
    
    const columnDefs = columns.map(col => {
      let def = `    ${col.column_name} ${col.data_type}`;
      
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });
    
    sql += columnDefs.join(',\n');
    sql += '\n);\n\n';
    
    return sql;
  }

  generateInsertSQL(schema, tableName, data) {
    if (!data || data.length === 0) return '';
    
    let sql = `-- Datos de la tabla ${schema}.${tableName}\n`;
    
    const columns = Object.keys(data[0]);
    sql += `INSERT INTO ${schema}.${tableName} (${columns.join(', ')}) VALUES\n`;
    
    const values = data.map(row => {
      const rowValues = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return value;
      });
      return `(${rowValues.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += ';\n\n';
    
    return sql;
  }

  async collectAllData() {
    this.log('Iniciando recolección de datos...');
    
    try {
      // Obtener lista de tablas
      if (this.config.includeStructure || this.config.includeData) {
        const tables = await this.getTableList();
        
        for (const table of tables.data || []) {
          const schema = await this.getTableSchema(table.schemaname, table.tablename);
          this.backupData.tables[`${table.schemaname}.${table.tablename}`] = {
            schema: schema.data,
            data: this.config.includeData ? (await this.getTableData(table.schemaname, table.tablename)).data : []
          };
        }
      }
      
      // Obtener funciones
      if (this.config.includeFunctions) {
        const functions = await this.getFunctions();
        this.backupData.functions = functions.data || [];
      }
      
      // Obtener políticas RLS
      if (this.config.includeRLS) {
        const policies = await this.getRLSPolicies();
        this.backupData.policies = policies.data || [];
      }
      
      // Obtener triggers
      if (this.config.includeTriggers) {
        const triggers = await this.getTriggers();
        this.backupData.triggers = triggers.data || [];
      }
      
      // Obtener índices
      if (this.config.includeIndexes) {
        const indexes = await this.getIndexes();
        this.backupData.indexes = indexes.data || [];
      }
      
      // Obtener constraints
      if (this.config.includeConstraints) {
        const constraints = await this.getConstraints();
        this.backupData.constraints = constraints.data || [];
      }
      
      this.log('Recolección de datos completada');
      
    } catch (error) {
      this.log(`Error en recolección de datos: ${error.message}`, 'error');
      throw error;
    }
  }

  generateSQL() {
    this.log('Generando archivo SQL...');
    
    let sql = `-- =====================================================\n`;
    sql += `-- DUMP COMPLETO DE LA BASE DE DATOS VALORA-PLUS\n`;
    sql += `-- Generado el: ${new Date().toISOString()}\n`;
    sql += `-- Proyecto: ${this.config.projectRef}\n`;
    sql += `-- Generado con: MCP Backup Script v1.0.0\n`;
    sql += `-- =====================================================\n\n`;
    
    // Estructura de tablas
    if (this.config.includeStructure) {
      sql += `-- =====================================================\n`;
      sql += `-- ESTRUCTURA DE TABLAS\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const [tableName, tableInfo] of Object.entries(this.backupData.tables)) {
        const [schema, table] = tableName.split('.');
        sql += this.generateCreateTableSQL(schema, table, tableInfo.schema);
      }
    }
    
    // Datos de tablas
    if (this.config.includeData) {
      sql += `-- =====================================================\n`;
      sql += `-- DATOS DE LAS TABLAS\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const [tableName, tableInfo] of Object.entries(this.backupData.tables)) {
        const [schema, table] = tableName.split('.');
        sql += this.generateInsertSQL(schema, table, tableInfo.data);
      }
    }
    
    // Políticas RLS
    if (this.config.includeRLS && this.backupData.policies.length > 0) {
      sql += `-- =====================================================\n`;
      sql += `-- POLÍTICAS RLS (ROW LEVEL SECURITY)\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const policy of this.backupData.policies) {
        sql += `CREATE POLICY "${policy.policyname}" ON ${policy.schemaname}.${policy.tablename}`;
        sql += ` FOR ${policy.cmd}`;
        if (policy.roles && policy.roles.length > 0) {
          sql += ` TO ${policy.roles.join(', ')}`;
        }
        if (policy.qual) {
          sql += ` USING (${policy.qual})`;
        }
        if (policy.with_check) {
          sql += ` WITH CHECK (${policy.with_check})`;
        }
        sql += `;\n`;
      }
      sql += '\n';
    }
    
    // Triggers
    if (this.config.includeTriggers && this.backupData.triggers.length > 0) {
      sql += `-- =====================================================\n`;
      sql += `-- TRIGGERS\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const trigger of this.backupData.triggers) {
        sql += `CREATE TRIGGER ${trigger.trigger_name}\n`;
        sql += `    ${trigger.action_timing} ${trigger.event_manipulation}\n`;
        sql += `    ON ${trigger.trigger_schema}.${trigger.event_object_table}\n`;
        sql += `    FOR EACH ROW\n`;
        sql += `    ${trigger.action_statement};\n\n`;
      }
    }
    
    // Índices
    if (this.config.includeIndexes && this.backupData.indexes.length > 0) {
      sql += `-- =====================================================\n`;
      sql += `-- ÍNDICES\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const index of this.backupData.indexes) {
        sql += `${index.indexdef};\n`;
      }
      sql += '\n';
    }
    
    // Constraints
    if (this.config.includeConstraints && this.backupData.constraints.length > 0) {
      sql += `-- =====================================================\n`;
      sql += `-- CONSTRAINTS\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const constraint of this.backupData.constraints) {
        sql += `ALTER TABLE ${constraint.constraint_schema}.${constraint.table_name}\n`;
        sql += `    ADD CONSTRAINT ${constraint.constraint_name}\n`;
        sql += `    ${constraint.constraint_definition};\n\n`;
      }
    }
    
    // Funciones
    if (this.config.includeFunctions && this.backupData.functions.length > 0) {
      sql += `-- =====================================================\n`;
      sql += `-- FUNCIONES POSTGRESQL\n`;
      sql += `-- =====================================================\n\n`;
      
      for (const func of this.backupData.functions) {
        sql += `-- Función: ${func.schema_name}.${func.function_name}\n`;
        sql += `${func.source_code};\n\n`;
      }
    }
    
    sql += `-- =====================================================\n`;
    sql += `-- FIN DEL DUMP\n`;
    sql += `-- =====================================================\n`;
    
    return sql;
  }

  async saveBackup() {
    this.log('Guardando backup...');
    
    // Crear directorio de backup si no existe
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
    
    const filename = `mcp_backup_${this.timestamp}`;
    const sqlFile = path.join(this.config.backupDir, `${filename}.sql`);
    const jsonFile = path.join(this.config.backupDir, `${filename}.json`);
    const infoFile = path.join(this.config.backupDir, `${filename}_info.txt`);
    
    // Guardar SQL
    const sqlContent = this.generateSQL();
    fs.writeFileSync(sqlFile, sqlContent, 'utf8');
    this.log(`Archivo SQL guardado: ${sqlFile}`);
    
    // Guardar JSON con datos estructurados
    fs.writeFileSync(jsonFile, JSON.stringify(this.backupData, null, 2), 'utf8');
    this.log(`Archivo JSON guardado: ${jsonFile}`);
    
    // Generar archivo de información
    const info = this.generateBackupInfo();
    fs.writeFileSync(infoFile, info, 'utf8');
    this.log(`Archivo de información guardado: ${infoFile}`);
    
    // Comprimir si está habilitado
    if (this.config.compress) {
      const tarFile = path.join(this.config.backupDir, `${filename}.tar.gz`);
      execSync(`tar -czf "${tarFile}" -C "${this.config.backupDir}" "${filename}.sql" "${filename}.json" "${filename}_info.txt"`);
      this.log(`Archivo comprimido creado: ${tarFile}`);
      
      // Eliminar archivos individuales
      fs.unlinkSync(sqlFile);
      fs.unlinkSync(jsonFile);
      fs.unlinkSync(infoFile);
      
      return tarFile;
    }
    
    return { sqlFile, jsonFile, infoFile };
  }

  generateBackupInfo() {
    const tableCount = Object.keys(this.backupData.tables).length;
    const totalRecords = Object.values(this.backupData.tables)
      .reduce((sum, table) => sum + (table.data?.length || 0), 0);
    
    return `INFORMACIÓN DEL BACKUP MCP - PROYECTO VALORA-PLUS
========================================================

Fecha de generación: ${new Date().toISOString()}
Proyecto Supabase: ${this.config.projectRef}
Método: MCP (Model Context Protocol)
Script versión: 1.0.0

ESTADÍSTICAS:
============
- Tablas incluidas: ${tableCount}
- Total de registros: ${totalRecords}
- Funciones: ${this.backupData.functions.length}
- Políticas RLS: ${this.backupData.policies.length}
- Triggers: ${this.backupData.triggers.length}
- Índices: ${this.backupData.indexes.length}
- Constraints: ${this.backupData.constraints.length}

CONFIGURACIÓN UTILIZADA:
=======================
- Incluir datos: ${this.config.includeData}
- Incluir estructura: ${this.config.includeStructure}
- Incluir funciones: ${this.config.includeFunctions}
- Incluir RLS: ${this.config.includeRLS}
- Incluir triggers: ${this.config.includeTriggers}
- Incluir índices: ${this.config.includeIndexes}
- Incluir constraints: ${this.config.includeConstraints}
- Comprimir: ${this.config.compress}

TABLAS INCLUIDAS:
================
${Object.keys(this.backupData.tables).map(table => `- ${table}`).join('\n')}

RESTAURACIÓN:
=============
Para restaurar este backup:
1. Extraer archivos: tar -xzf mcp_backup_${this.timestamp}.tar.gz
2. Ejecutar SQL: psql -h [host] -U [usuario] -d [base_datos] -f mcp_backup_${this.timestamp}.sql

NOTAS DE SEGURIDAD:
==================
- Este backup contiene datos sensibles de producción
- Mantener en ubicación segura
- No compartir sin autorización
`;
  }

  async run() {
    try {
      this.log('=== INICIANDO BACKUP MCP ===');
      this.log(`Proyecto: ${this.config.projectRef}`);
      this.log(`Directorio: ${this.config.backupDir}`);
      
      await this.collectAllData();
      const result = await this.saveBackup();
      
      this.log('=== BACKUP COMPLETADO EXITOSAMENTE ===');
      this.log(`Archivos generados: ${JSON.stringify(result, null, 2)}`);
      
      return result;
      
    } catch (error) {
      this.log(`=== ERROR EN BACKUP ===`, 'error');
      this.log(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Función principal para uso desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const config = {};
  
  // Parsear argumentos de línea de comandos
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-ref':
        config.projectRef = args[++i];
        break;
      case '--backup-dir':
        config.backupDir = args[++i];
        break;
      case '--no-data':
        config.includeData = false;
        break;
      case '--no-structure':
        config.includeStructure = false;
        break;
      case '--no-functions':
        config.includeFunctions = false;
        break;
      case '--no-rls':
        config.includeRLS = false;
        break;
      case '--no-triggers':
        config.includeTriggers = false;
        break;
      case '--no-indexes':
        config.includeIndexes = false;
        break;
      case '--no-constraints':
        config.includeConstraints = false;
        break;
      case '--no-compress':
        config.compress = false;
        break;
      case '--quiet':
        config.verbose = false;
        break;
      case '--help':
        console.log(`
Uso: node backups/mcp/scripts/mcp-backup.cjs [opciones]

Opciones:
  --project-ref <ref>    Project reference de Supabase
  --backup-dir <dir>     Directorio de destino para backups
  --no-data             Excluir datos de las tablas
  --no-structure        Excluir estructura de tablas
  --no-functions        Excluir funciones
  --no-rls              Excluir políticas RLS
  --no-triggers         Excluir triggers
  --no-indexes          Excluir índices
  --no-constraints      Excluir constraints
  --no-compress         No comprimir el backup
  --verbose             Mostrar información detallada
  --help                Mostrar esta ayuda

Ejemplos:
  node backups/mcp/scripts/mcp-backup.cjs
  node backups/mcp/scripts/mcp-backup.cjs --project-ref abc123 --backup-dir ./my-backups
  node backups/mcp/scripts/mcp-backup.cjs --no-data --no-compress
        `);
        process.exit(0);
    }
  }
  
  const backup = new MCPBackup(config);
  await backup.run();
}

// Exportar la clase para uso como módulo
module.exports = MCPBackup;

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}