# Estructura de Base de Datos - Usuarios y Roles

## Resumen de la Configuración Actual

### Tablas Principales

1. **auth.users** - Tabla de autenticación de Supabase
2. **public.profiles** - Perfiles de usuario con roles
3. **public.workshops** - Información de talleres

### Relaciones

```
auth.users (1) ←→ (1) public.profiles ←→ (0..1) public.workshops
```

- Cada usuario en `auth.users` tiene exactamente un perfil en `public.profiles`
- Cada perfil puede estar asociado a un workshop (admin_mechanic) o no (admin)

### Roles Configurados

#### 1. **admin** - Administrador del SaaS
- **Propósito**: Gestión completa del sistema
- **Permisos**: 
  - Ver todos los talleres
  - Ver todos los perfiles
  - Gestionar usuarios del sistema
- **Relación con workshops**: No tiene workshop asociado (`workshop_id = NULL`)

#### 2. **admin_mechanic** - Administrador de Taller
- **Propósito**: Gestión de su propio taller
- **Permisos**:
  - Ver y editar su propio taller
  - Ver y editar su propio perfil
  - Gestionar análisis de su taller
- **Relación con workshops**: Tiene un workshop asociado (`workshop_id` específico)

### Usuarios de Prueba Configurados

#### Admin del Sistema
- **Email**: admin@valoraplus.com
- **Password**: admin123
- **Rol**: admin
- **Workshop**: Ninguno

#### Admin Mechanics
1. **Taller Mecánico Demo**
   - **Email**: demo@tallerdemo.com
   - **Password**: Demo123!
   - **Rol**: admin_mechanic
   - **Nombre**: Juan Pérez
   - **Workshop**: Taller Mecánico Demo

2. **AutoReparaciones SL**
   - **Email**: info@autoreparaciones.com
   - **Password**: Auto123!
   - **Rol**: admin_mechanic
   - **Nombre**: María García
   - **Workshop**: AutoReparaciones SL

### Flujo de Registro

1. **Nuevo Taller se Registra**:
   - Se crea usuario en `auth.users`
   - Se crea workshop en `public.workshops`
   - Se crea perfil en `public.profiles` con rol `admin_mechanic`
   - Se vincula perfil con workshop mediante `workshop_id`

2. **Admin del Sistema**:
   - Creado manualmente en migraciones
   - No se registra a través de la aplicación

### Preparación para Módulos Futuros

La estructura está preparada para:

1. **Módulo de Administración SaaS** (rol `admin`):
   - Lista de todos los talleres
   - Lista de todos los usuarios
   - Estadísticas globales
   - Gestión de análisis realizados

2. **Módulo de Taller** (rol `admin_mechanic`):
   - Gestión de su propio taller
   - Análisis de vehículos
   - Reportes específicos del taller

### Políticas de Seguridad (RLS)

- **Profiles**: Los usuarios solo pueden ver/editar su propio perfil, admins pueden ver todos
- **Workshops**: Los admin_mechanic solo pueden ver/editar su workshop, admins pueden ver todos
- **Futuras tablas de análisis**: Seguirán el mismo patrón de seguridad

### Verificación de Consistencia

Para verificar que todo esté correcto, ejecutar:

```sql
-- Ver usuarios y roles
SELECT 
    u.email,
    p.role,
    p.full_name,
    w.name as workshop_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.workshops w ON p.workshop_id = w.id
ORDER BY p.role, u.email;

-- Ver workshops y sus admin_mechanics
SELECT 
    w.name as workshop_name,
    w.email as workshop_email,
    p.full_name as admin_mechanic_name,
    u.email as admin_mechanic_email
FROM public.workshops w
LEFT JOIN public.profiles p ON w.id = p.workshop_id
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY w.name;
```