-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update activate_speed_booster to NOT fill lives immediately
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_booster RECORD;
  v_multiplier INTEGER;
  v_max_lives INTEGER;
  v_expires_at TIMESTAMPTZ := now() + interval '60 minutes';
BEGIN
  SELECT * INTO v_booster
  FROM public.user_boosters
  WHERE id = booster_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booster not found or not owned by user';
  END IF;

  IF v_booster.activated THEN
    RETURN true;
  END IF;

  CASE v_booster.booster_type
    WHEN 'DoubleSpeed' THEN v_multiplier := 2; v_max_lives := 25;
    WHEN 'MegaSpeed'   THEN v_multiplier := 4; v_max_lives := 35;
    WHEN 'GigaSpeed'   THEN v_multiplier := 12; v_max_lives := 75;
    WHEN 'DingleSpeed' THEN v_multiplier := 24; v_max_lives := 135;
    ELSE RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  -- Mark booster as activated
  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = v_expires_at
  WHERE id = booster_id AND user_id = auth.uid();

  -- Update profile with booster settings but DON'T add lives immediately
  UPDATE public.profiles
  SET speed_booster_active = true,
      speed_booster_expires_at = v_expires_at,
      speed_booster_multiplier = v_multiplier,
      max_lives = v_max_lives,
      lives_regeneration_rate = CASE v_multiplier
        WHEN 2 THEN 6
        WHEN 4 THEN 3
        WHEN 12 THEN 1
        WHEN 24 THEN 1
        ELSE 12
      END,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$function$;