// Edge Function: Recordatorios de Devolución
// Envía emails a usuarios con libros que vencen en 3 días

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚙️ CONFIGURACIÓN
const FROM_EMAIL = "Biblioteca Olalde <avisos@bibliotecaolalde.com>"
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const DAYS_BEFORE_DUE = 3 // Días antes del vencimiento

interface LoanWithUserAndBook {
  id: string
  book_id: number
  user_id: string
  created_at: string
  book: {
    titulo: string
    nombre: string
    apellido: string
  }
  user_email?: string
  user_name?: string
}

serve(async (req) => {
  try {
    // Crear cliente de Supabase con service_role para acceder a auth.users
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`⏰ Buscando préstamos que vencen en ${DAYS_BEFORE_DUE} días...`)

    // Calcular fecha de vencimiento (15 días desde el préstamo)
    // Queremos préstamos creados hace exactamente (15 - 3) = 12 días
    const now = new Date()
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() - (15 - DAYS_BEFORE_DUE))
    
    // Rango de 24 horas para capturar préstamos de ese día
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    console.log(`📅 Buscando préstamos creados entre: ${startOfDay.toISOString()} y ${endOfDay.toISOString()}`)

    // 1. Obtener préstamos activos que vencen en 3 días
    const { data: loans, error: loansError } = await supabaseClient
      .from('loans')
      .select(`
        id,
        book_id,
        user_id,
        created_at,
        book:books (
          titulo,
          nombre,
          apellido
        )
      `)
      .eq('status', 'active')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())

    if (loansError) {
      console.error('Error consultando préstamos:', loansError)
      throw loansError
    }

    if (!loans || loans.length === 0) {
      console.log('ℹ️ No hay préstamos que venzan en 3 días')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay préstamos que requieran recordatorio',
          reminders_sent: 0
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`📚 Encontrados ${loans.length} préstamos que vencen en 3 días`)

    // 2. Obtener información de usuarios de auth.users
    const userIds = loans.map(loan => loan.user_id)
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers()

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError)
      throw usersError
    }

    // Mapear users por ID para acceso rápido
    const usersMap = new Map(
      users?.map(user => [user.id, {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email
      }]) || []
    )

    // 3. Enviar emails individuales
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const loan of loans as LoanWithUserAndBook[]) {
      try {
        const userInfo = usersMap.get(loan.user_id)
        
        if (!userInfo || !userInfo.email) {
          console.error(`⚠️ Usuario ${loan.user_id} no tiene email`)
          errorCount++
          results.push({
            loan_id: loan.id,
            user_id: loan.user_id,
            success: false,
            error: 'Usuario sin email'
          })
          continue
        }

        // Calcular fecha de vencimiento (15 días desde created_at)
        const loanDate = new Date(loan.created_at)
        const dueDate = new Date(loanDate)
        dueDate.setDate(dueDate.getDate() + 15)
        
        const dueDateFormatted = dueDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })

        // Preparar datos del libro
        const bookData = Array.isArray(loan.book) ? loan.book[0] : loan.book
        const bookTitle = bookData?.titulo || 'Libro sin título'
        const bookAuthor = bookData ? `${bookData.apellido}, ${bookData.nombre}` : 'Autor desconocido'

        // Generar HTML del email
        const emailHtml = generateReminderEmailHtml(
          userInfo.name || 'Usuario',
          bookTitle,
          bookAuthor,
          dueDateFormatted
        )

        // Enviar email con Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [userInfo.email],
            subject: `⏳ Tu libro vence en ${DAYS_BEFORE_DUE} días - Biblioteca Olalde`,
            html: emailHtml
          })
        })

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text()
          throw new Error(`Error enviando email: ${errorText}`)
        }

        const resendData = await resendResponse.json()
        
        console.log(`✅ Recordatorio enviado a ${userInfo.email} (Loan ID: ${loan.id})`)
        successCount++
        
        results.push({
          loan_id: loan.id,
          user_id: loan.user_id,
          user_email: userInfo.email,
          book_title: bookTitle,
          success: true,
          email_id: resendData.id
        })

      } catch (error) {
        console.error(`❌ Error enviando recordatorio para loan ${loan.id}:`, error)
        errorCount++
        
        results.push({
          loan_id: loan.id,
          user_id: loan.user_id,
          success: false,
          error: error.message
        })
        
        // NO detenemos el bucle, continuamos con los demás usuarios
      }
    }

    console.log(`\n📊 Resumen: ${successCount} enviados, ${errorCount} errores`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recordatorios procesados: ${successCount} enviados, ${errorCount} errores`,
        total_loans: loans.length,
        reminders_sent: successCount,
        errors: errorCount,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error en send-return-reminders:', error)
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

function generateReminderEmailHtml(
  userName: string,
  bookTitle: string,
  bookAuthor: string,
  dueDate: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Devolución</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 8px;">⏳</div>
      <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">
        Recordatorio de Devolución
      </h1>
    </div>

    <!-- Contenido Principal -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      
      <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
        Hola <strong>${userName}</strong>,
      </p>

      <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Te recordamos que el libro que tienes prestado vence en <strong style="color: #dc2626;">3 días</strong>.
      </p>

      <!-- Información del Libro -->
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          📚 Libro Prestado
        </p>
        <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px; font-weight: 700; line-height: 1.3;">
          ${bookTitle}
        </h2>
        <p style="margin: 0; color: #6b7280; font-size: 15px;">
          ${bookAuthor}
        </p>
      </div>

      <!-- Fecha de Vencimiento -->
      <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #9a3412; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          📅 Fecha Límite de Devolución
        </p>
        <p style="margin: 0; color: #7c2d12; font-size: 24px; font-weight: 700;">
          ${dueDate}
        </p>
      </div>

      <!-- Mensaje Final -->
      <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
        Por favor, devuelve el libro a su zona correspondiente antes de la fecha límite para evitar retrasos.
      </p>

      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
        ¡Gracias por ser parte de nuestra comunidad lectora! 📖
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
        Este es un recordatorio automático de Biblioteca Olalde
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        Si ya devolviste el libro, ignora este mensaje
      </p>
    </div>

  </div>
</body>
</html>
  `
}
