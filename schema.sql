-- ============================================================
--  Done and Dusted — collaboration schema
--  Run once against your Postgres database:
--    psql $DATABASE_URL -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Rooms
-- ------------------------------------------------------------
CREATE TABLE rooms (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(8)  UNIQUE NOT NULL,        -- e.g. "XK9P2M"
  name        VARCHAR(100) NOT NULL,
  owner       VARCHAR(50) NOT NULL,               -- username of creator
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Members  (everyone who has ever joined a room)
-- ------------------------------------------------------------
CREATE TABLE room_members (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username     VARCHAR(50) NOT NULL,
  color        VARCHAR(20) NOT NULL DEFAULT '#6366f1',  -- avatar colour
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, username)
);

-- ------------------------------------------------------------
-- Lists inside a room
-- ------------------------------------------------------------
CREATE TABLE room_lists (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_by VARCHAR(50)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tasks inside room lists
-- Subtasks are stored as JSONB to mirror the local data model.
-- ------------------------------------------------------------
CREATE TABLE room_todos (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id      UUID        NOT NULL REFERENCES room_lists(id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(50),
  priority     VARCHAR(10) NOT NULL DEFAULT 'medium',  -- low | medium | high
  tag          VARCHAR(50),
  due_date     DATE,
  notes        TEXT,
  recurrence   VARCHAR(20),                            -- daily | weekly | monthly
  subtasks     JSONB       NOT NULL DEFAULT '[]',
  assigned_to  VARCHAR(50),
  order_index  INT         NOT NULL DEFAULT 0,
  created_by   VARCHAR(50) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_todos_updated_at
  BEFORE UPDATE ON room_todos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Reactions on tasks  (one per user per task, upserted on re-click)
-- ------------------------------------------------------------
CREATE TABLE room_reactions (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id    UUID        NOT NULL REFERENCES room_todos(id) ON DELETE CASCADE,
  username   VARCHAR(50) NOT NULL,
  emoji      VARCHAR(4)  NOT NULL,   -- '👀'  '✅'  '🚫'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(todo_id, username)
);

-- ------------------------------------------------------------
-- Activity feed
-- ------------------------------------------------------------
CREATE TABLE room_activity (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username    VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  -- add_task | complete_task | delete_task | assign_task
  -- add_reaction | join_room | add_list | delete_list
  entity_text TEXT,        -- human-readable subject  e.g. "Buy groceries"
  details     JSONB,       -- extra context: { list_name, assigned_to, emoji … }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Live presence  (who is online and what they are editing)
-- Rows are upserted on each client heartbeat (every 10 s).
-- Stale rows (> 30 s old) are treated as offline.
-- ------------------------------------------------------------
CREATE TABLE room_presence (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username        VARCHAR(50) NOT NULL,
  editing_todo_id UUID        REFERENCES room_todos(id) ON DELETE SET NULL,
  last_ping_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, username)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX ON rooms(code);
CREATE INDEX ON rooms(expires_at);
CREATE INDEX ON room_members(room_id);
CREATE INDEX ON room_lists(room_id);
CREATE INDEX ON room_todos(list_id);
CREATE INDEX ON room_todos(assigned_to);
CREATE INDEX ON room_activity(room_id, created_at DESC);
CREATE INDEX ON room_presence(room_id);
CREATE INDEX ON room_presence(last_ping_at);  -- fast stale-cleanup query

-- ------------------------------------------------------------
-- Row-level security
-- This app uses username-based identity (no Supabase Auth),
-- so we open all tables to the anon key with permissive policies.
-- ------------------------------------------------------------
ALTER TABLE rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_lists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_todos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_activity  ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_presence  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open" ON rooms          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_members   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_lists     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_todos     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_activity  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON room_presence  FOR ALL USING (true) WITH CHECK (true);
