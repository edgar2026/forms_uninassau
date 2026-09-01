import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ugpkojgzyqzzssbsdope.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncGtvamd6eXF6enNzYnNkb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDkxMjcsImV4cCI6MjEwMzc4NTEyN30.3V6hOpDGRcAIvsOnIEvMklIQ5muyypx2lMjGJsQcl18';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
