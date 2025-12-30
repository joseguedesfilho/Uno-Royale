
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';

const supabaseUrl = 'https://eddlsohehnzmarjgonen.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZGxzb2hlaG56bWFyamdvbmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjE3NDIsImV4cCI6MjA4MjU5Nzc0Mn0.Jo2s5xHMgsAOLqniXXyHdY-TBrnc4csyX9RqtxGnfq4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
