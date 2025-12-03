-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  school TEXT,
  class_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, school, class_year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'school', ''),
    COALESCE(NEW.raw_user_meta_data->>'class_year', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  ocr_text TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  subtopics TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topics"
  ON public.topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own topics"
  ON public.topics FOR ALL
  USING (auth.uid() = user_id);

-- Weak spots table
CREATE TABLE public.weak_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  identified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.weak_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weak spots"
  ON public.weak_spots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weak spots"
  ON public.weak_spots FOR ALL
  USING (auth.uid() = user_id);

-- Learning content table
CREATE TABLE public.learning_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weak_spot_id UUID REFERENCES public.weak_spots(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('feynman', 'explanation', 'analogy', 'mindmap', 'example')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning content"
  ON public.learning_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning content"
  ON public.learning_content FOR ALL
  USING (auth.uid() = user_id);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions"
  ON public.questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own questions"
  ON public.questions FOR ALL
  USING (auth.uid() = user_id);

-- Attempts table
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  time_taken INTEGER,
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Revision schedule table
CREATE TABLE public.revision_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number IN (1, 3, 7, 15, 30)),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revision schedule"
  ON public.revision_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own revision schedule"
  ON public.revision_schedule FOR ALL
  USING (auth.uid() = user_id);

-- Timetable table
CREATE TABLE public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timetable"
  ON public.timetable FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own timetable"
  ON public.timetable FOR ALL
  USING (auth.uid() = user_id);

-- Mastery tracking table
CREATE TABLE public.mastery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  mastery_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  accuracy DECIMAL(5,2),
  avg_time INTEGER,
  last_practiced TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.mastery_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mastery"
  ON public.mastery_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mastery"
  ON public.mastery_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notes_user ON public.notes(user_id);
CREATE INDEX idx_topics_user ON public.topics(user_id);
CREATE INDEX idx_weak_spots_user ON public.weak_spots(user_id);
CREATE INDEX idx_questions_user ON public.questions(user_id);
CREATE INDEX idx_attempts_user ON public.attempts(user_id);
CREATE INDEX idx_revision_schedule_user_date ON public.revision_schedule(user_id, scheduled_date);
CREATE INDEX idx_timetable_user_day ON public.timetable(user_id, day_of_week);
CREATE INDEX idx_mastery_user_topic ON public.mastery_tracking(user_id, topic_id);