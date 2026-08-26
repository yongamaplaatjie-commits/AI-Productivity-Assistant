CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  recipient text NOT NULL DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.note_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.note_summaries TO service_role;
ALTER TABLE public.note_summaries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.research_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  topic text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.research_items TO service_role;
ALTER TABLE public.research_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  input_text text NOT NULL DEFAULT '',
  hours_per_day numeric NOT NULL DEFAULT 0,
  total_hours numeric NOT NULL DEFAULT 0,
  overview text NOT NULL DEFAULT '',
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.study_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  plan_id uuid REFERENCES public.study_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'task',
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'Medium',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.study_tasks TO service_role;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_emails_visitor ON public.emails (visitor_id, created_at DESC);
CREATE INDEX idx_notes_visitor ON public.note_summaries (visitor_id, created_at DESC);
CREATE INDEX idx_research_visitor ON public.research_items (visitor_id, created_at DESC);
CREATE INDEX idx_plans_visitor ON public.study_plans (visitor_id, created_at DESC);
CREATE INDEX idx_tasks_visitor ON public.study_tasks (visitor_id, due_at);
CREATE INDEX idx_chat_visitor ON public.chat_messages (visitor_id, created_at);