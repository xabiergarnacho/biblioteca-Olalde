// Edge Function: Reporte Mensual de Biblioteca Olalde
// Envía estadísticas mensuales al administrador

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚙️ CONFIGURACIÓN - Edita estos valores
const ADMIN_EMAIL = "xabier.garnacho@gmail.com" // 👈 Cambiar por el email del admin
const FROM_EMAIL = "Reportes Biblioteca <avisos@bibliotecaolalde.com>"
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface MonthlyStats {
  totalLoans: number
  activeLoans: number
  returnedLoans: number
  totalIncidents: number
  pendingIncidents: number
  newUsers: number
  topBooks: Array<{
    titulo: string
    autor: string
    loans_count: number
  }>
}

serve(async (req) => {
  try {
    // Crear cliente de Supabase con service_role para acceso completo
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calcular fecha del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    console.log(`📊 Generando reporte mensual: ${firstDayOfMonth.toLocaleDateString('es-ES')} - ${lastDayOfMonth.toLocaleDateString('es-ES')}`)

    // 1. Préstamos del mes
    const { data: loans, error: loansError } = await supabaseClient
      .from('loans')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString())

    if (loansError) throw loansError

    const totalLoans = loans?.length || 0
    const activeLoans = loans?.filter(l => l.status === 'active').length || 0
    const returnedLoans = loans?.filter(l => l.status === 'returned').length || 0

    // 2. Incidencias del mes
    const { data: incidents, error: incidentsError } = await supabaseClient
      .from('incidents')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString())

    if (incidentsError) throw incidentsError

    const totalIncidents = incidents?.length || 0
    const pendingIncidents = incidents?.filter(i => i.status === 'pending').length || 0

    // 3. Nuevos usuarios del mes (accediendo a auth.users requiere service_role)
    const { count: newUsers, error: usersError } = await supabaseClient
      .from('loans')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString())

    if (usersError) throw usersError

    // 4. Top 5 libros más prestados del mes
    const { data: topBooks, error: topBooksError } = await supabaseClient
      .rpc('get_top_books_month', {
        start_date: firstDayOfMonth.toISOString(),
        end_date: lastDayOfMonth.toISOString()
      })

    // Si no existe la función RPC, hacerlo manualmente
    let topBooksFormatted: MonthlyStats['topBooks'] = []
    if (!topBooksError && topBooks) {
      topBooksFormatted = topBooks.slice(0, 5)
    }

    const stats: MonthlyStats = {
      totalLoans,
      activeLoans,
      returnedLoans,
      totalIncidents,
      pendingIncidents,
      newUsers: newUsers || 0,
      topBooks: topBooksFormatted
    }

    // Generar HTML del email
    const emailHtml = generateMonthlyReportHtml(stats, firstDayOfMonth, lastDayOfMonth)

    // Enviar email con Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `📊 Reporte Mensual: Biblioteca Olalde - ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        html: emailHtml
      })
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      throw new Error(`Error enviando email: ${errorText}`)
    }

    const resendData = await resendResponse.json()

    console.log('✅ Reporte mensual enviado exitosamente:', resendData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reporte mensual enviado',
        stats,
        emailId: resendData.id
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error en send-monthly-report:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function generateMonthlyReportHtml(stats: MonthlyStats, startDate: Date, endDate: Date): string {
  const monthName = startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  
  const topBooksHtml = stats.topBooks.length > 0
    ? stats.topBooks.map((book, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; color: #6b7280;">${index + 1}</td>
          <td style="padding: 12px 16px; font-weight: 500; color: #111827;">${book.titulo}</td>
          <td style="padding: 12px 16px; color: #6b7280;">${book.autor}</td>
          <td style="padding: 12px 16px; text-align: center; font-weight: 600; color: #059669;">${book.loans_count}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #9ca3af;">Sin datos de préstamos este mes</td></tr>'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Mensual - Biblioteca Olalde</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
        📊 Reporte Mensual
      </h1>
      <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 16px;">
        Biblioteca Olalde - ${monthName}
      </p>
    </div>

    <!-- Resumen de Estadísticas -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
        Resumen del Mes
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <!-- Préstamos Totales -->
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Préstamos Totales
          </p>
          <p style="margin: 0; color: #111827; font-size: 28px; font-weight: 700;">
            ${stats.totalLoans}
          </p>
        </div>

        <!-- Préstamos Activos -->
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 4px 0; color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Activos
          </p>
          <p style="margin: 0; color: #1e3a8a; font-size: 28px; font-weight: 700;">
            ${stats.activeLoans}
          </p>
        </div>

        <!-- Devoluciones -->
        <div style="background-color: #d1fae5; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 4px 0; color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Devueltos
          </p>
          <p style="margin: 0; color: #064e3b; font-size: 28px; font-weight: 700;">
            ${stats.returnedLoans}
          </p>
        </div>

        <!-- Incidencias -->
        <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Incidencias
          </p>
          <p style="margin: 0; color: #7f1d1d; font-size: 28px; font-weight: 700;">
            ${stats.totalIncidents}
            ${stats.pendingIncidents > 0 ? `<span style="font-size: 14px; color: #dc2626;">(${stats.pendingIncidents} pendientes)</span>` : ''}
          </p>
        </div>
      </div>
    </div>

    <!-- Top 5 Libros -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
        📚 Top 5 Libros Más Prestados
      </h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">#</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Título</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Autor</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Préstamos</th>
          </tr>
        </thead>
        <tbody>
          ${topBooksHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; color: #9ca3af; font-size: 13px;">
        Este es un reporte automático generado el ${new Date().toLocaleDateString('es-ES')}
      </p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">
        Biblioteca Olalde © ${new Date().getFullYear()}
      </p>
    </div>

  </div>
</body>
</html>
  `
}
