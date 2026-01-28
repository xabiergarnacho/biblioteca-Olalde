# 📧 Edge Functions - Sistema de Emails Automatizados
## Biblioteca Olalde

Este directorio contiene las Edge Functions de Supabase para el sistema de notificaciones por email de la Biblioteca Olalde.

---

## 📋 Índice

- [Funciones Disponibles](#funciones-disponibles)
- [Requisitos Previos](#requisitos-previos)
- [Configuración Inicial](#configuración-inicial)
- [Deployment](#deployment)
- [Programación Automática](#programación-automática)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Funciones Disponibles

### 1. **send-monthly-report** 📊
**Propósito**: Envía un reporte mensual de estadísticas al administrador.

**Contenido del reporte**:
- Préstamos totales del mes
- Préstamos activos y devueltos
- Incidencias registradas
- Top 5 libros más prestados

**Frecuencia**: Día 1 de cada mes a las 09:00 AM  
**Destinatario**: Email del administrador (configurado en el código)

---

### 2. **send-return-reminders** ⏳
**Propósito**: Envía recordatorios a usuarios con libros que vencen en 3 días.

**Contenido del email**:
- Nombre del libro prestado
- Autor del libro
- Fecha límite de devolución
- Mensaje de recordatorio personalizado

**Frecuencia**: Todos los días a las 09:00 AM  
**Destinatario**: Usuarios con préstamos próximos a vencer

---

## 🛠️ Requisitos Previos

### 1. Cuenta de Resend
- Crear cuenta en [resend.com](https://resend.com)
- Verificar dominio: `bibliotecaolalde.com`
- Obtener API Key

### 2. Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
supabase --version
```

### 3. Variables de Entorno
Las siguientes variables deben estar configuradas en Supabase:

- `RESEND_API_KEY` - API key de Resend
- `SUPABASE_URL` - URL del proyecto (auto-configurada)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-configurada)

---

## ⚙️ Configuración Inicial

### Paso 1: Configurar Resend

1. Ve a [resend.com/domains](https://resend.com/domains)
2. Añade tu dominio: `bibliotecaolalde.com`
3. Configura los registros DNS (MX, TXT, CNAME)
4. Verifica el dominio

### Paso 2: Obtener API Key de Resend

1. Ve a [resend.com/api-keys](https://resend.com/api-keys)
2. Crea una nueva API key
3. Copia la key (empieza con `re_`)

### Paso 3: Configurar Variables en Supabase

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. **Settings** → **Edge Functions** → **Secrets**
3. Añade la variable:
   ```
   RESEND_API_KEY=re_tu_api_key_aqui
   ```

### Paso 4: Configurar Email del Administrador

Edita el archivo `send-monthly-report/index.ts`:

```typescript
// Línea 8
const ADMIN_EMAIL = "tu-email@example.com" // 👈 Cambia esto
```

---

## 🚀 Deployment

### Opción 1: Deploy Automático (Recomendado)

```bash
# Navegar al directorio del proyecto
cd c:\Users\xabie\biblioteca-olalde

# Login en Supabase
supabase login

# Link al proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Deploy todas las funciones
supabase functions deploy send-monthly-report
supabase functions deploy send-return-reminders
```

### Opción 2: Deploy Manual por Función

```bash
# Deploy reporte mensual
supabase functions deploy send-monthly-report --no-verify-jwt

# Deploy recordatorios
supabase functions deploy send-return-reminders --no-verify-jwt
```

### Verificar Deployment

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Deberías ver ambas funciones listadas
3. Estado: `Active` ✅

---

## ⏰ Programación Automática

### Configurar pg_cron

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta el archivo: `database_migrations/setup_email_cron.sql`
3. **IMPORTANTE**: Reemplaza `YOUR_PROJECT_REF` con tu project reference

```sql
-- Ejemplo:
function_url := 'https://abc123xyz.supabase.co/functions/v1/send-monthly-report';
```

### Encontrar tu Project Reference

Tu Project Reference está en:
- **Dashboard URL**: `https://supabase.com/dashboard/project/[PROJECT_REF]`
- O en: **Settings** → **General** → **Reference ID**

### Verificar Cron Jobs

```sql
-- Ver jobs activos
SELECT * FROM cron.job;

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Horarios Configurados

| Función | Frecuencia | Hora (UTC) | Hora España (CET/CEST) |
|---------|-----------|------------|------------------------|
| Reporte Mensual | Día 1 de cada mes | 09:00 | 10:00 / 11:00 |
| Recordatorios | Todos los días | 09:00 | 10:00 / 11:00 |

**Nota**: Supabase usa UTC. Ajusta las horas según tu zona horaria.

---

## 🧪 Testing

### Test Manual de Funciones

#### 1. Probar Reporte Mensual

```bash
# Desde terminal
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-monthly-report \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

O desde **SQL Editor**:
```sql
SELECT invoke_monthly_report();
```

#### 2. Probar Recordatorios

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-return-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

O desde **SQL Editor**:
```sql
SELECT invoke_return_reminders();
```

### Logs de Ejecución

Ver logs en **Supabase Dashboard** → **Edge Functions** → [Función] → **Logs**

---

## 🔧 Troubleshooting

### Problema 1: Email no se envía

**Verificar**:
1. ✅ API Key de Resend correcta en variables de entorno
2. ✅ Dominio verificado en Resend
3. ✅ Email del remitente usa el dominio verificado
4. ✅ Revisa logs en Dashboard de Resend

### Problema 2: Cron no se ejecuta

**Verificar**:
1. ✅ Extensión `pg_cron` habilitada
2. ✅ Project Reference correcto en funciones SQL
3. ✅ Revisa `cron.job_run_details` para ver errores

```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC 
LIMIT 5;
```

### Problema 3: Error 401 Unauthorized

**Solución**: Añade `--no-verify-jwt` al deploy:
```bash
supabase functions deploy send-monthly-report --no-verify-jwt
```

### Problema 4: Usuarios no reciben emails

**Verificar**:
1. ✅ Usuarios tienen email válido en `auth.users`
2. ✅ Préstamos tienen `created_at` correcto
3. ✅ Status del préstamo es `active`
4. ✅ Revisa logs de la función para errores específicos

---

## 📊 Estructura de la Base de Datos

### Tablas Necesarias

```sql
-- loans
- id: uuid
- user_id: uuid
- book_id: integer
- status: text ('active' | 'returned')
- created_at: timestamp
- liked: boolean

-- books
- id: integer
- titulo: text
- nombre: text
- apellido: text

-- incidents
- id: uuid
- type: text
- book_id: integer (opcional)
- user_id: uuid
- status: text
- created_at: timestamp
```

---

## 🔐 Seguridad

### Variables Secretas

**NUNCA** commitees:
- ❌ `RESEND_API_KEY`
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ Emails de administrador en el código (usar variables de entorno)

### Permisos

Las funciones usan `SUPABASE_SERVICE_ROLE_KEY` para:
- Acceder a `auth.users` (emails de usuarios)
- Leer todas las tablas sin restricciones RLS

**Importante**: Estas funciones son seguras porque se ejecutan en el servidor (Edge Functions), no en el cliente.

---

## 📝 Notas Adicionales

### Personalización de Emails

Los templates HTML están en las funciones:
- `send-monthly-report/index.ts` → función `generateMonthlyReportHtml()`
- `send-return-reminders/index.ts` → función `generateReminderEmailHtml()`

Edita directamente el HTML para cambiar estilos o contenido.

### Cambiar Frecuencia de Recordatorios

Por defecto, los recordatorios se envían **3 días antes**. Para cambiar:

```typescript
// send-return-reminders/index.ts
const DAYS_BEFORE_DUE = 3 // 👈 Cambiar a 1, 2, 5, etc.
```

Luego redeploy:
```bash
supabase functions deploy send-return-reminders
```

### Límites de Resend

- **Plan Gratuito**: 100 emails/día, 3,000/mes
- **Plan Pro**: 50,000 emails/mes desde $20/mes

Para la biblioteca, el plan gratuito debería ser suficiente.

---

## 🆘 Soporte

**Problemas con Resend**: [resend.com/support](https://resend.com/support)  
**Problemas con Supabase**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)  
**Logs del Proyecto**: Dashboard → Edge Functions → Logs

---

## ✅ Checklist de Deployment

- [ ] Cuenta de Resend creada y dominio verificado
- [ ] API Key de Resend obtenida
- [ ] Variable `RESEND_API_KEY` configurada en Supabase
- [ ] Email del admin configurado en `send-monthly-report/index.ts`
- [ ] Edge Functions desplegadas exitosamente
- [ ] SQL de pg_cron ejecutado con Project Reference correcto
- [ ] Test manual de ambas funciones realizado
- [ ] Verificado que los cron jobs están activos en `cron.job`
- [ ] Logs revisados para confirmar que no hay errores

---

**Estado**: ✅ Sistema de emails listo para producción

**Última actualización**: $(date)

---

*Documentación mantenida por el equipo de Biblioteca Olalde*
