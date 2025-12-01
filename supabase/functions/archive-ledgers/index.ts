// PHASE 2 OPTIMIZATION: Archive old ledger entries
// Runs monthly to prevent wallet_ledger and lives_ledger table bloat
//
// TODO FUTURE REFACTOR (NOT IMPLEMENTED YET):
// - lives_ledger is redundant with wallet_ledger (which has delta_lives column)
// - Consider merging lives_ledger into wallet_ledger completely
// - This would eliminate duplicate archival logic and simplify schema
// - Risk: requires migrating all historical lives_ledger entries into wallet_ledger
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    console.log('[archive-ledgers] Starting ledger archival...');
    const startTime = Date.now();

    // Archive wallet ledger
    const { data: walletResult, error: walletError } = await supabase.rpc('archive_old_wallet_ledger');
    if (walletError) {
      console.error('[archive-ledgers] Wallet ledger error:', walletError);
      throw walletError;
    }

    // Archive lives ledger
    const { data: livesResult, error: livesError } = await supabase.rpc('archive_old_lives_ledger');
    if (livesError) {
      console.error('[archive-ledgers] Lives ledger error:', livesError);
      throw livesError;
    }

    const elapsed = Date.now() - startTime;
    console.log(`[archive-ledgers] ✅ Archived ${walletResult.archived_count} wallet + ${livesResult.archived_count} lives entries in ${elapsed}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        elapsed_ms: elapsed,
        wallet_ledger: walletResult,
        lives_ledger: livesResult
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[archive-ledgers] Failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
