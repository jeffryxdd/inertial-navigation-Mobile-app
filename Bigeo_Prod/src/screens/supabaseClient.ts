import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con tus credenciales de Supabase
const supabaseUrl = 'https://smbfuplvavqmdwlxnhyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYmZ1cGx2YXZxbWR3bHhuaHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNTUyNjQsImV4cCI6MjA0NjgzMTI2NH0.2roJW4JoG-3lIQCyYDHkLRxwyVQi2yYLPW_KuQOu8n8';

export const supabase = createClient(supabaseUrl, supabaseKey);
