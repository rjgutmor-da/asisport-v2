import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const allowedApplications = new Set(['asisport', 'saasport'])

const getSessionId = (accessToken: string): string | null => {
  try {
    const payload = accessToken.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.session_id === 'string' ? decoded.session_id : null
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, application, deviceId, deviceLabel } = await req.json()
    if (!email || !password || !allowedApplications.has(application)) {
      return new Response(
        JSON.stringify({ error: 'Solicitud de inicio de sesión inválida.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: attemptData } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .single()

    const now = new Date()
    if (attemptData && attemptData.attempts >= 5) {
      if (attemptData.blocked_until) {
        const blockedUntil = new Date(attemptData.blocked_until)
        if (blockedUntil > now) {
          const secondsLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
          return new Response(
            JSON.stringify({ 
              error: `Demasiados intentos. Por favor, espera ${secondsLeft} segundos antes de intentar de nuevo.`,
              secondsLeft 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const currentAttempts = (attemptData?.attempts ?? 0) + 1
      let blockedUntil = attemptData?.blocked_until

      if (currentAttempts >= 5) {
        blockedUntil = new Date(now.getTime() + 60000).toISOString()
      }

      await supabaseAdmin.from('login_attempts').upsert({
        email,
        attempts: currentAttempts,
        blocked_until: blockedUntil,
        updated_at: now.toISOString(),
      })

      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin.from('login_attempts').upsert({
      email,
      attempts: 0,
      blocked_until: null,
      updated_at: now.toISOString(),
    })

    const sessionId = authData.session?.access_token
      ? getSessionId(authData.session.access_token)
      : null
    if (!authData.session?.user?.id || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'No se pudo identificar la sesión creada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: registration, error: registrationError } = await supabaseAdmin.rpc(
      'rpc_register_login_session',
      {
        p_user_id: authData.session.user.id,
        p_session_id: sessionId,
        p_application: application,
        p_device_id: deviceId ?? 'unknown-device',
        p_device_label: deviceLabel ?? null,
      }
    )

    if (registrationError || !registration?.ok) {
      return new Response(
        JSON.stringify({ error: registration?.reason || registrationError?.message || 'No se pudo habilitar esta sesión.' }),
        { status: registration?.reason === 'application_not_allowed' ? 403 : 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ session: authData.session, application, replacedSessionId: registration.revoked_session_id ?? null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
