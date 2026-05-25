
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.around_view_comments
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Update insert policy to encourage (but not strictly require) a password
DROP POLICY IF EXISTS "anyone can leave an around view comment" ON public.around_view_comments;
CREATE POLICY "anyone can leave an around view comment"
ON public.around_view_comments
FOR INSERT
TO public
WITH CHECK (
  char_length(user_name) <= 60
  AND char_length(content) BETWEEN 1 AND 280
  AND pitch BETWEEN -1.5708 AND 1.5708
  AND yaw BETWEEN -6.2832 AND 6.2832
);

-- Update function
CREATE OR REPLACE FUNCTION public.update_around_comment(
  _id uuid,
  _password text,
  _content text
) RETURNS public.around_view_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.around_view_comments;
BEGIN
  SELECT * INTO _row FROM public.around_view_comments WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '코멘트를 찾을 수 없습니다.' USING ERRCODE = 'P0002';
  END IF;
  IF _row.password_hash IS NULL THEN
    RAISE EXCEPTION '비밀번호가 설정되지 않은 코멘트입니다.' USING ERRCODE = 'P0001';
  END IF;
  IF _row.password_hash <> crypt(_password, _row.password_hash) THEN
    RAISE EXCEPTION '비밀번호가 일치하지 않습니다.' USING ERRCODE = '28P01';
  END IF;
  IF char_length(coalesce(_content,'')) < 1 OR char_length(_content) > 280 THEN
    RAISE EXCEPTION '내용은 1~280자여야 합니다.' USING ERRCODE = '22023';
  END IF;
  UPDATE public.around_view_comments
    SET content = _content
    WHERE id = _id
    RETURNING * INTO _row;
  RETURN _row;
END;
$$;

-- Delete function
CREATE OR REPLACE FUNCTION public.delete_around_comment(
  _id uuid,
  _password text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.around_view_comments;
BEGIN
  SELECT * INTO _row FROM public.around_view_comments WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '코멘트를 찾을 수 없습니다.' USING ERRCODE = 'P0002';
  END IF;
  IF _row.password_hash IS NULL THEN
    RAISE EXCEPTION '비밀번호가 설정되지 않은 코멘트입니다.' USING ERRCODE = 'P0001';
  END IF;
  IF _row.password_hash <> crypt(_password, _row.password_hash) THEN
    RAISE EXCEPTION '비밀번호가 일치하지 않습니다.' USING ERRCODE = '28P01';
  END IF;
  DELETE FROM public.around_view_comments WHERE id = _id;
  RETURN true;
END;
$$;

-- Helper to insert with hashed password (so client never sends plaintext on the row)
CREATE OR REPLACE FUNCTION public.insert_around_comment(
  _path_id text,
  _user_name text,
  _pitch double precision,
  _yaw double precision,
  _content text,
  _password text
) RETURNS public.around_view_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.around_view_comments;
  _hash text;
BEGIN
  IF char_length(coalesce(_content,'')) < 1 OR char_length(_content) > 280 THEN
    RAISE EXCEPTION '내용은 1~280자여야 합니다.' USING ERRCODE = '22023';
  END IF;
  IF char_length(coalesce(_user_name,'')) > 60 THEN
    RAISE EXCEPTION '이름은 60자 이하여야 합니다.' USING ERRCODE = '22023';
  END IF;
  IF _pitch < -1.5708 OR _pitch > 1.5708 OR _yaw < -6.2832 OR _yaw > 6.2832 THEN
    RAISE EXCEPTION '좌표 범위 오류' USING ERRCODE = '22023';
  END IF;
  IF _password IS NOT NULL AND char_length(_password) > 0 THEN
    IF char_length(_password) < 4 OR char_length(_password) > 60 THEN
      RAISE EXCEPTION '비밀번호는 4~60자여야 합니다.' USING ERRCODE = '22023';
    END IF;
    _hash := crypt(_password, gen_salt('bf'));
  END IF;
  INSERT INTO public.around_view_comments (path_id, user_name, pitch, yaw, content, password_hash)
  VALUES (_path_id, coalesce(nullif(trim(_user_name),''),'익명의 여행자'), _pitch, _yaw, _content, _hash)
  RETURNING * INTO _row;
  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_around_comment(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_around_comment(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_around_comment(text, text, double precision, double precision, text, text) TO anon, authenticated;
