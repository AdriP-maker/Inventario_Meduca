import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://thrhkwphhjqfqjrxtmzx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocmhrd3BoaGpxZnFqcnh0bXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODYzOTEsImV4cCI6MjEwMDY2MjM5MX0.0Z6AL9bvu54wCpLQ8Qlx5N-AyT5FWLZIl5QqENxeB3g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
