-- ==============================================================================
-- Mowatib (مواظب) - Master Supabase PostgreSQL Schema
-- Complete schema with Row Level Security (RLS), Triggers, Constraints & Indices
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Africa/Cairo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Lists Table (Flat lists, Inbox is null list_id)
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4C662B',
  icon TEXT DEFAULT 'list',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lists" ON public.lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Recurrence Rules Table
CREATE TABLE IF NOT EXISTS public.recurrence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  interval INTEGER DEFAULT 1,
  end_type TEXT DEFAULT 'never' CHECK (end_type IN ('never', 'count', 'date')),
  end_count INTEGER NULL,
  end_date DATE NULL,
  timezone TEXT DEFAULT 'Africa/Cairo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recurrence rules" ON public.recurrence_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  list_id UUID NULL REFERENCES public.lists(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE NULL,
  due_time TIME NULL,
  position INTEGER DEFAULT 0,
  recurrence_rule_id UUID NULL REFERENCES public.recurrence_rules(id) ON DELETE SET NULL,
  parent_task_id UUID NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Subtasks Table (Lightweight checklist)
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subtasks" ON public.subtasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3d5622',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON public.tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Task Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own task tags" ON public.task_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Task Occurrences Table (Independent Occurrence Records)
CREATE TABLE IF NOT EXISTS public.task_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurrence_rule_id UUID NOT NULL REFERENCES public.recurrence_rules(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  completed_at TIMESTAMPTZ NULL,
  timezone TEXT DEFAULT 'Africa/Cairo',
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.task_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own task occurrences" ON public.task_occurrences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  occurrence_id UUID NULL REFERENCES public.task_occurrences(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  is_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#4C662B',
  frequency TEXT DEFAULT 'daily',
  target_days_per_week INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. Habit Completions Table
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (habit_id, completed_date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own habit completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. Pomodoro Sessions Table (Server-Authoritative)
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NULL REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_title_snapshot TEXT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('focus', 'short_break', 'long_break', 'infinite')),
  planned_duration INTEGER NOT NULL,
  elapsed_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own pomodoro sessions" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. Automated 7-Day Trash Permanent Deletion Function
CREATE OR REPLACE FUNCTION purge_expired_trash()
RETURNS void AS $$
BEGIN
  -- Permanently delete records deleted more than 7 days ago
  DELETE FROM public.tasks WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM public.lists WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM public.notes WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM public.habits WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM public.task_occurrences WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indices for Fast Performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(user_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_occurrences_date ON public.task_occurrences(user_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON public.pomodoro_sessions(user_id, started_at);
