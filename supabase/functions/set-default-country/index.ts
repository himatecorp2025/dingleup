import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users without country_code
    const { data: usersWithoutCountry, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .is('country_code', null)

    if (fetchError) {
      console.error('Error fetching users without country:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${usersWithoutCountry?.length || 0} users without country_code`)

    // Set default country_code to 'HU' for all users without one
    if (usersWithoutCountry && usersWithoutCountry.length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ country_code: 'HU' })
        .is('country_code', null)

      if (updateError) {
        console.error('Error updating country codes:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update country codes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Updated ${usersWithoutCountry.length} users with default country_code: HU`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: usersWithoutCountry?.length || 0,
        message: 'Default country codes set successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})