-- =========================================
-- COMPREHENSIVE RLS SECURITY REMEDIATION (Fixed)
-- Critical Phase: RLS Policies for All Tables
-- =========================================

-- =========================================
-- 1. PROFILES TABLE
-- =========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 2. USER_ROLES TABLE
-- =========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 3. WALLET_LEDGER
-- =========================================
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallet ledger" ON public.wallet_ledger;
DROP POLICY IF EXISTS "Service role can manage all wallet ledger" ON public.wallet_ledger;
DROP POLICY IF EXISTS "Admins can view all wallet ledger" ON public.wallet_ledger;

CREATE POLICY "Users can view their own wallet ledger"
ON public.wallet_ledger FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all wallet ledger"
ON public.wallet_ledger FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all wallet ledger"
ON public.wallet_ledger FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 4. LIVES_LEDGER
-- =========================================
ALTER TABLE public.lives_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own lives ledger" ON public.lives_ledger;
DROP POLICY IF EXISTS "Service role can manage all lives ledger" ON public.lives_ledger;

CREATE POLICY "Users can view their own lives ledger"
ON public.lives_ledger FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all lives ledger"
ON public.lives_ledger FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================
-- 5. PIN_RESET_TOKENS
-- =========================================
ALTER TABLE public.pin_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.pin_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage reset tokens" ON public.pin_reset_tokens;

CREATE POLICY "Users can view their own reset tokens"
ON public.pin_reset_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reset tokens"
ON public.pin_reset_tokens FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================
-- 6. PURCHASES
-- =========================================
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;

CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 7. SPEED_TOKENS (skip - already has policies)
-- =========================================
-- Table already configured with RLS policies

-- =========================================
-- 8. QUESTIONS
-- =========================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage questions"
ON public.questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 9. QUESTION_TRANSLATIONS
-- =========================================
ALTER TABLE public.question_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view question translations" ON public.question_translations;
DROP POLICY IF EXISTS "Admins can manage question translations" ON public.question_translations;

CREATE POLICY "Anyone can view question translations"
ON public.question_translations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage question translations"
ON public.question_translations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 10. QUESTION_LIKES
-- =========================================
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all likes" ON public.question_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.question_likes;

CREATE POLICY "Users can view all likes"
ON public.question_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own likes"
ON public.question_likes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 11. QUESTION_DISLIKES
-- =========================================
ALTER TABLE public.question_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all dislikes" ON public.question_dislikes;
DROP POLICY IF EXISTS "Users can manage their own dislikes" ON public.question_dislikes;

CREATE POLICY "Users can view all dislikes"
ON public.question_dislikes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own dislikes"
ON public.question_dislikes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 12. TRANSLATIONS
-- =========================================
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view translations" ON public.translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.translations;

CREATE POLICY "Anyone can view translations"
ON public.translations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage translations"
ON public.translations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 13. TOPICS
-- =========================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;

CREATE POLICY "Anyone can view topics"
ON public.topics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage topics"
ON public.topics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 14. USER_PRESENCE
-- =========================================
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view friends presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;

CREATE POLICY "Users can view their own presence"
ON public.user_presence FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends presence"
ON public.user_presence FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'active'
      AND ((user_id_a = auth.uid() AND user_id_b = user_presence.user_id)
        OR (user_id_b = auth.uid() AND user_id_a = user_presence.user_id))
  )
);

CREATE POLICY "Users can update their own presence"
ON public.user_presence FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 15. THREAD_PARTICIPANTS
-- =========================================
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own thread participants" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can update their own thread participants" ON public.thread_participants;

CREATE POLICY "Users can view their own thread participants"
ON public.thread_participants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own thread participants"
ON public.thread_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 16. REPORTS
-- =========================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 17. USER_TOPIC_STATS
-- =========================================
ALTER TABLE public.user_topic_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own topic stats" ON public.user_topic_stats;
DROP POLICY IF EXISTS "Service role can manage topic stats" ON public.user_topic_stats;
DROP POLICY IF EXISTS "Admins can view all topic stats" ON public.user_topic_stats;

CREATE POLICY "Users can view their own topic stats"
ON public.user_topic_stats FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage topic stats"
ON public.user_topic_stats FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all topic stats"
ON public.user_topic_stats FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 18. USER_AD_INTEREST_CANDIDATES
-- =========================================
ALTER TABLE public.user_ad_interest_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ad interests" ON public.user_ad_interest_candidates;
DROP POLICY IF EXISTS "Service role can manage ad interests" ON public.user_ad_interest_candidates;
DROP POLICY IF EXISTS "Admins can view all ad interests" ON public.user_ad_interest_candidates;

CREATE POLICY "Users can view their own ad interests"
ON public.user_ad_interest_candidates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage ad interests"
ON public.user_ad_interest_candidates FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all ad interests"
ON public.user_ad_interest_candidates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 19. RPC_RATE_LIMITS
-- =========================================
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rpc_rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rpc_rate_limits;

CREATE POLICY "Users can view their own rate limits"
ON public.rpc_rate_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rate limits"
ON public.rpc_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);