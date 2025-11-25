-- Enable public SELECT access for question_pools table (game needs to load pools)
CREATE POLICY "Public can view question pools"
ON public.question_pools
FOR SELECT
TO public
USING (true);

-- Enable public SELECT access for questions table (game needs to load questions)
CREATE POLICY "Public can view questions"
ON public.questions
FOR SELECT
TO public
USING (true);