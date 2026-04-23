import type { default as AppSchema } from './app/AppSchema.js';
import type { default as AuthSchema } from './auth/AuthSchema.js';

type Database = AppSchema & AuthSchema;

export type { Database as default };