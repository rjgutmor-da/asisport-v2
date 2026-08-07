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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido.' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { application, deviceId, deviceLabel } = await req.json()
    if (!allowedApplications.has(application)) {
      return new Response(JSON.stringify({ error: 'Aplicación inválida.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authorization = req.headers.get('Authorization')
    const accessToken = authorization?.replace(/^Bearer\s+/i, '')
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Falta la sesión.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
    const sessionId = getSessionId(accessToken)
    if (userError || !userData.user || !sessionId) {
      return new Response(JSON.stringify({ error: 'Sesión inválida o vencida.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await admin.rpc('rpc_register_login_session', {
      p_user_id: userData.user.id,
      p_session_id: sessionId,
      p_application: application,
      p_device_id: deviceId ?? 'unknown-device',
      p_device_label: deviceLabel ?? null,
    })
    if (error || !data?.ok) {
      return new Response(JSON.stringify({ error: data?.reason || error?.message || 'Sesión no autorizada.', reason: data?.reason }), {
        status: data?.reason === 'application_not_allowed' ? 403 : 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ...data, ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
