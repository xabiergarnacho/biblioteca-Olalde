# 🚀 Guía Rápida: Sistema de Emails Automatizados
## Biblioteca Olalde - Deployment en Producción

---

## 📝 Resumen Ejecutivo

Has implementado un sistema completo de notificaciones por email con:

✅ **2 Edge Functions** de Supabase  
✅ **Emails profesionales HTML** con diseño responsive  
✅ **Programación automática** con pg_cron  
✅ **Integración con Resend** (dominio verificado)

---

## 🎯 ¿Qué hace cada función?

### 1. **Reporte Mensual** 📊
- **Qué**: Estadísticas completas del mes
- **Cuándo**: Día 1 de cada mes a las 09:00
- **A quién**: Email del administrador
- **Contenido**:
  - Total de préstamos
  - Préstamos activos/devueltos
  - Incidencias del mes
  - Top 5 libros más prestados

### 2. **Recordatorios de Devolución** ⏳
- **Qué**: Aviso de libro próximo a vencer
- **Cuándo**: Todos los días a las 09:00
- **A quién**: Usuarios con libros que vencen en 3 días
- **Contenido**:
  - Nombre del libro
  - Fecha límite
  - Mensaje personalizado

---

## ⚡ Deployment Rápido (5 pasos)

### **Paso 1: Configurar Resend** (5 min)

```bash
1. Ir a: https://resend.com
2. Crear cuenta / Iniciar sesión
3. Agregar dominio: bibliotecaolalde.com
4. Configurar DNS (copiar registros MX, TXT, CNAME)
5. Esperar verificación del dominio ✅
6. Crear API Key y copiarla
```

### **Paso 2: Configurar Variables en Supabase** (2 min)

```bash
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. Añadir:
   RESEND_API_KEY = re_tu_api_key_aqui
3. Guardar ✅
```

### **Paso 3: Editar Email del Admin** (1 min)

Archivo: `supabase/functions/send-monthly-report/index.ts`

```typescript
// Línea 8
const ADMIN_EMAIL = "xabier.garnacho@gmail.com" // 👈 Tu email aquí
```

### **Paso 4: Deploy de Funciones** (3 min)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link al proyecto (usa tu Project Reference)
supabase link --project-ref pgxrlatgyvchtypawsym

# Deploy ambas funciones
supabase functions deploy send-monthly-report --no-verify-jwt
supabase functions deploy send-return-reminders --no-verify-jwt
```

### **Paso 5: Configurar Programación Automática** (2 min)

```bash
1. Supabase Dashboard → SQL Editor
2. Abrir: database_migrations/setup_email_cron.sql
3. Reemplazar 'YOUR_PROJECT_REF' por: pgxrlatgyvchtypawsym
4. Ejecutar todo el script ✅
5. Verificar: SELECT * FROM cron.job;
```

---

## 🧪 Testing Inmediato

### Probar Reporte Mensual (Manual)

```bash
# Desde SQL Editor de Supabase:
SELECT invoke_monthly_report();

# Deberías recibir un email en tu bandeja en ~30 segundos
```

### Probar Recordatorios (Manual)

```bash
# Desde SQL Editor de Supabase:
SELECT invoke_return_reminders();

# Si hay préstamos que vencen en 3 días, se enviarán los emails
```

### Ver Logs

```bash
# En Supabase Dashboard:
Edge Functions → [Nombre de función] → Logs

# En SQL para ver ejecuciones de cron:
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 📅 Calendario de Ejecuciones

| Función | Primera Ejecución | Frecuencia |
|---------|------------------|------------|
| **Reporte Mensual** | 1 de Febrero 2026, 09:00 UTC | Mensual (día 1) |
| **Recordatorios** | Hoy, 09:00 UTC (si hay préstamos) | Diaria |

**Nota**: UTC = España - 1 hora (invierno) o - 2 horas (verano)

---

## ✅ Checklist de Verificación

Después del deployment, verifica:

- [ ] ✅ Ambas funciones aparecen en Dashboard → Edge Functions
- [ ] ✅ Estado de funciones: "Active"
- [ ] ✅ Variable `RESEND_API_KEY` configurada
- [ ] ✅ Dominio verificado en Resend (icono verde)
- [ ] ✅ Email del admin configurado en código
- [ ] ✅ Test manual ejecutado exitosamente
- [ ] ✅ Email de prueba recibido
- [ ] ✅ Cron jobs visibles en `cron.job` (2 jobs)
- [ ] ✅ No hay errores en logs

---

## 🔍 Troubleshooting Rápido

### ❌ Error: "Invalid API key"
**Solución**: Verifica que `RESEND_API_KEY` esté correcta en Secrets

### ❌ Error: "Domain not verified"
**Solución**: Espera a que Resend verifique tu dominio (puede tardar 24h)

### ❌ No recibo emails
**Solución**: 
1. Verifica spam
2. Revisa logs de Edge Function
3. Verifica email del admin en el código

### ❌ Cron no se ejecuta
**Solución**: Verifica Project Reference en funciones SQL

---

## 📧 Formato de Emails

### Email de Reporte Mensual
```
De: Reportes Biblioteca <avisos@bibliotecaolalde.com>
Para: [Email del admin]
Asunto: 📊 Reporte Mensual: Biblioteca Olalde - enero 2026

[HTML con diseño profesional]
- Estadísticas en tarjetas
- Tabla de top 5 libros
- Gráficos visuales
```

### Email de Recordatorio
```
De: Biblioteca Olalde <avisos@bibliotecaolalde.com>
Para: [Email del usuario]
Asunto: ⏳ Tu libro vence en 3 días - Biblioteca Olalde

[HTML con diseño profesional]
- Nombre del libro
- Fecha límite destacada
- Mensaje personalizado
```

---

## 🔧 Configuración Avanzada

### Cambiar Frecuencia de Recordatorios

Por defecto: 3 días antes. Para cambiar:

```typescript
// supabase/functions/send-return-reminders/index.ts
const DAYS_BEFORE_DUE = 5 // Cambiar a 1, 2, 5, etc.
```

Luego redeploy:
```bash
supabase functions deploy send-return-reminders --no-verify-jwt
```

### Cambiar Horario de Cron Jobs

Edita el archivo SQL y cambia el cron expression:

```sql
-- Ejemplo: Cambiar a las 08:00 en lugar de 09:00
'0 8 1 * *'  -- Reporte mensual a las 08:00
'0 8 * * *'  -- Recordatorios a las 08:00
```

Luego ejecuta de nuevo el SQL.

---

## 📊 Monitoreo

### Ver Estadísticas de Emails

1. Ve a: [resend.com/emails](https://resend.com/emails)
2. Verás todos los emails enviados
3. Estados: Delivered / Bounced / Opened

### Ver Ejecuciones de Cron

```sql
-- Últimas 20 ejecuciones
SELECT 
  jobid,
  job_name,
  status,
  start_time,
  end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 💰 Costos

### Resend (Plan Gratuito)
- ✅ 100 emails/día
- ✅ 3,000 emails/mes
- ✅ Suficiente para biblioteca pequeña/mediana

### Supabase Edge Functions
- ✅ 500,000 invocaciones/mes gratis
- ✅ Suficiente para todas las necesidades

**Total mensual**: $0 💚

---

## 📚 Documentación Completa

Para instrucciones detalladas, ver:
- `supabase/functions/README.md` - Guía completa de Edge Functions
- `database_migrations/setup_email_cron.sql` - SQL comentado

---

## 🆘 Soporte

**Errores en funciones**: Dashboard → Edge Functions → Logs  
**Errores en cron**: SQL Editor → `SELECT * FROM cron.job_run_details`  
**Problemas con Resend**: [resend.com/support](https://resend.com/support)

---

## ✨ Próximos Pasos

1. ✅ Deployar funciones
2. ✅ Configurar cron
3. ✅ Probar manualmente
4. 📅 Esperar primera ejecución automática
5. 📊 Monitorear logs durante primera semana
6. 🎉 ¡Sistema en producción!

---

**Estado del Sistema**: 🟢 Listo para Producción

**Fecha de creación**: 28 de enero de 2026

---

*Sistema implementado para Biblioteca Olalde*
*Documentación actualizada y lista para deployment*
