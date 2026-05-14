CREATE TABLE public.around_view_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id TEXT NOT NULL REFERENCES public.paths(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT '익명의 여행자',
  avatar_url TEXT,
  pitch DOUBLE PRECISION NOT NULL,
  yaw DOUBLE PRECISION NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_around_view_comments_path_id ON public.around_view_comments(path_id);

ALTER TABLE public.around_view_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "around view comments are viewable by everyone"
ON public.around_view_comments FOR SELECT
USING (true);

CREATE POLICY "anyone can leave an around view comment"
ON public.around_view_comments FOR INSERT
WITH CHECK (
  char_length(user_name) <= 60
  AND char_length(content) BETWEEN 1 AND 280
  AND pitch BETWEEN -1.5708 AND 1.5708
  AND yaw BETWEEN -6.2832 AND 6.2832
);