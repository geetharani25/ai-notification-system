CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT    NOT NULL UNIQUE,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS channels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  created_by  INTEGER REFERENCES users(id),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  type           TEXT    NOT NULL CHECK(type IN ('dm', 'channel')),
  content        TEXT    NOT NULL,
  sender_id      INTEGER NOT NULL REFERENCES users(id),
  receiver_id    INTEGER REFERENCES users(id),
  channel_id     INTEGER REFERENCES channels(id),
  urgency        TEXT    CHECK(urgency IN ('high', 'medium', 'low')),
  urgency_reason TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  message_id INTEGER NOT NULL REFERENCES messages(id),
  type       TEXT    NOT NULL CHECK(type IN ('dm', 'broadcast')),
  is_read    INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_channel   ON messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_dm        ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
