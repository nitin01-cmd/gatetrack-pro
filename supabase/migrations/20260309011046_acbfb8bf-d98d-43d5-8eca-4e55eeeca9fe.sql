
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subject settings
CREATE TABLE public.subject_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  total_lectures integer DEFAULT 30 NOT NULL,
  UNIQUE(user_id, subject)
);
ALTER TABLE public.subject_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.subject_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lectures
CREATE TABLE public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  lecture_number integer NOT NULL,
  topic text NOT NULL,
  status text DEFAULT 'Not Started' NOT NULL,
  difficulty integer DEFAULT 3 NOT NULL,
  pyq_solved boolean DEFAULT false NOT NULL,
  revision_count integer DEFAULT 0 NOT NULL,
  last_revision date,
  next_revision date,
  completed_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lectures" ON public.lectures FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Revisions
CREATE TABLE public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lecture_id uuid REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  due_date date NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  day_interval integer NOT NULL,
  revision_number integer NOT NULL,
  notes text DEFAULT '' NOT NULL,
  completed_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own revisions" ON public.revisions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PYQs
CREATE TABLE public.pyqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  year integer NOT NULL,
  solved boolean DEFAULT false NOT NULL,
  revision_needed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pyqs" ON public.pyqs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study logs
CREATE TABLE public.study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  hours_studied numeric DEFAULT 1 NOT NULL,
  notes text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study_logs" ON public.study_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User streaks
CREATE TABLE public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  study_streak integer DEFAULT 0 NOT NULL,
  last_study_date date
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streak" ON public.user_streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
