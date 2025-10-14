# Guía de Deployment - Valora Plus

## Deployment en Easypanel

### Requisitos Previos
- Cuenta en Easypanel
- Repositorio Git con el código
- Variables de entorno de Supabase

### Pasos para el Deployment

1. **Subir código al repositorio**
   ```bash
   git add .
   git commit -m "Deploy to Easypanel"
   git push origin main
   ```

2. **Crear servicio en Easypanel**
   - Ve a tu panel de Easypanel
   - Crea una nueva aplicación
   - Selecciona "Git Repository"
   - Conecta tu repositorio

3. **Configurar Variables de Entorno**
   
   **IMPORTANTE**: Debes configurar estas variables en la sección "Environment Variables" de Easypanel:
   
   ```
   VITE_SUPABASE_URL=https://piynzvpnurnvbrmkyneo.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeW56dnBudXJudmJybWt5bmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjk0MzMsImV4cCI6MjA3NTk0NTQzM30.OJH_xmSuTE6Q0Pen5rswn5VSUdSfARyvjCKDV_xVPfE
   VITE_SUPABASE_PROJECT_ID=piynzvpnurnvbrmkyneo
   ```

4. **Configuración del Servicio**
   - Puerto: `80`
   - Dockerfile: Se detectará automáticamente
   - Build Context: `/` (raíz del proyecto)

5. **Deploy**
   - Haz clic en "Deploy"
   - Easypanel construirá la imagen usando el Dockerfile
   - Las variables de entorno se pasarán como build arguments automáticamente

### Solución de Problemas

#### Error: "Missing Supabase environment variables"
- **Causa**: Las variables de entorno no están configuradas correctamente
- **Solución**: Verifica que las variables estén configuradas en Easypanel exactamente como se muestra arriba

#### Error durante el build
- **Causa**: Variables no disponibles durante el proceso de build
- **Solución**: El Dockerfile actualizado ahora acepta las variables como build arguments

### Verificación del Deployment

Una vez deployado, verifica que:
1. La aplicación carga correctamente
2. Puedes hacer login/registro
3. Las funciones de Supabase funcionan

### Estructura de Archivos Importantes

```
├── Dockerfile              # Configuración Docker con build args
├── docker-compose.yml      # Para testing local con variables
├── .env.example           # Plantilla de variables de entorno
├── DEPLOYMENT.md          # Esta guía
└── deploy.sh             # Script de deployment local
```

### Variables de Entorno Explicadas

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Clave pública (anon key) de Supabase
- `VITE_SUPABASE_PROJECT_ID`: ID del proyecto Supabase

**Nota**: Estas variables son necesarias durante el build porque Vite las embebe en el código JavaScript compilado.