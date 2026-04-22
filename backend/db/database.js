import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

function seedDefaultChannel() {
  const existing = db.prepare('SELECT id FROM channels WHERE name = ?').get('general');
  if (!existing) {
    db.prepare("INSERT INTO channels (name, description) VALUES ('general', 'General discussion')").run();
  }
}

seedDefaultChannel();

export default db;
