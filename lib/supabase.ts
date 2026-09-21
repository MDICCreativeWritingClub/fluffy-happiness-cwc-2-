import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yxbxunsqipswvrcfgrsm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Ynh1bnNxaXBzd3ZyY2ZncnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTk5MzgsImV4cCI6MjEwMDI5NTkzOH0.8I0x0BgF0jvlYYlV01rs1L7qPWo-uRZT24HaS5JT7KU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
