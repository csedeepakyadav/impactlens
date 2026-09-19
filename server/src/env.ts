import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// .env lives at the repo root, one level above the server workspace cwd.
// Loaded here (imported first in index.ts) so every module sees the vars.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });
