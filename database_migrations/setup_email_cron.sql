-- ====================================================================
-- Configuración de pg_cron para Automatización de Emails
-- Biblioteca Olalde
-- ====================================================================

-- IMPORTANTE: Estos comandos deben ejecutarse en Supabase Dashboard
-- SQL Editor con las credenciales de administrador

-- ====================================================================
-- 1. HABILITAR EXTENSIÓN pg_cron (Si no está habilitada)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ====================================================================
-- 2. CREAR FUNCIÓN WRAPPER PARA INVOCAR EDGE FUNCTION (Reporte Mensual)
-- ====================================================================

CREATE OR REPLACE FUNCTION invoke_monthly_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- URL de la Edge Function desplegada en Supabase
  -- IMPORTANTE: Reemplaza 'YOUR_PROJECT_REF' con tu project reference
  function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-monthly-report';
  
  -- Invocar la función usando pg_net (extensión de Supabase para HTTP requests)
  SELECT INTO request_id
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  
  -- Log de la invocación
  RAISE NOTICE 'Monthly report triggered. Request ID: %', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error invoking monthly report: %', SQLERRM;
END;
$$;

-- ====================================================================
-- 3. CREAR FUNCIÓN WRAPPER PARA INVOCAR EDGE FUNCTION (Recordatorios)
-- ====================================================================

CREATE OR REPLACE FUNCTION invoke_return_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- URL de la Edge Function desplegada en Supabase
  -- IMPORTANTE: Reemplaza 'YOUR_PROJECT_REF' con tu project reference
  function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-return-reminders';
  
  -- Invocar la función usando pg_net
  SELECT INTO request_id
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  
  -- Log de la invocación
  RAISE NOTICE 'Return reminders triggered. Request ID: %', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error invoking return reminders: %', SQLERRM;
END;
$$;

-- ====================================================================
-- 4. PROGRAMAR CRON JOB: REPORTE MENSUAL
-- Ejecuta el día 1 de cada mes a las 09:00 AM (hora del servidor)
-- ====================================================================

SELECT cron.schedule(
  'monthly-report-biblioteca-olalde',  -- Nombre del job
  '0 9 1 * *',                          -- Cron: 09:00 del día 1 de cada mes
  $$SELECT invoke_monthly_report()$$
);

-- ====================================================================
-- 5. PROGRAMAR CRON JOB: RECORDATORIOS DE DEVOLUCIÓN
-- Ejecuta todos los días a las 09:00 AM (hora del servidor)
-- ====================================================================

SELECT cron.schedule(
  'daily-return-reminders-biblioteca-olalde',  -- Nombre del job
  '0 9 * * *',                                  -- Cron: 09:00 todos los días
  $$SELECT invoke_return_reminders()$$
);

-- ====================================================================
-- 6. VERIFICAR JOBS PROGRAMADOS
-- ====================================================================

-- Ver todos los cron jobs activos
SELECT * FROM cron.job;

-- Ver historial de ejecuciones (últimas 10)
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- ====================================================================
-- 7. COMANDOS DE GESTIÓN (Para administración)
-- ====================================================================

-- DESACTIVAR un job temporalmente
-- SELECT cron.unschedule('monthly-report-biblioteca-olalde');
-- SELECT cron.unschedule('daily-return-reminders-biblioteca-olalde');

-- REACTIVAR un job (re-programar con los mismos parámetros)
-- SELECT cron.schedule('monthly-report-biblioteca-olalde', '0 9 1 * *', $$SELECT invoke_monthly_report()$$);
-- SELECT cron.schedule('daily-return-reminders-biblioteca-olalde', '0 9 * * *', $$SELECT invoke_return_reminders()$$);

-- ELIMINAR un job permanentemente
-- SELECT cron.unschedule('monthly-report-biblioteca-olalde');
-- DROP FUNCTION invoke_monthly_report();

-- ====================================================================
-- 8. CONFIGURACIÓN ALTERNATIVA: INVOCAR DIRECTAMENTE (Sin pg_net)
-- ====================================================================

-- Si prefieres no usar pg_net, puedes usar Supabase REST API desde el cliente
-- o configurar webhooks externos. Esta es la opción más robusta con pg_net.

-- ====================================================================
-- NOTAS IMPORTANTES
-- ====================================================================

-- 1. TIMEZONE: Los cron jobs usan la zona horaria del servidor de Supabase (UTC)
--    Para España (UTC+1/+2), ajusta las horas según tu necesidad
--    Ejemplo: 09:00 UTC = 10:00 CET (invierno) o 11:00 CEST (verano)

-- 2. FORMATO CRON: 'minuto hora día mes día_semana'
--    '0 9 1 * *'  = 09:00 del día 1 de cada mes
--    '0 9 * * *'  = 09:00 todos los días
--    '0 9 * * 1'  = 09:00 todos los lunes
--    '*/15 * * * *' = Cada 15 minutos

-- 3. LOGS: Las ejecuciones se registran en cron.job_run_details
--    Revisa esta tabla si los jobs no se ejecutan correctamente

-- 4. PERMISOS: Asegúrate de que las funciones tengan acceso a net.http_post
--    y que tu proyecto tenga habilitada la extensión pg_net

-- 5. TESTING: Puedes probar manualmente las funciones:
--    SELECT invoke_monthly_report();
--    SELECT invoke_return_reminders();

-- ====================================================================
-- FIN DE CONFIGURACIÓN
-- ====================================================================
