import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const ROOT_DIR = join(fileURLToPath(dirname(import.meta.url)), '..');
