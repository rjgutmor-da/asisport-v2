import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()
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

    return new Response(
      JSON.stringify({ session: authData.session }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
