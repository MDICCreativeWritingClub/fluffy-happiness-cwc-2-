import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtlaacrgluajuuuskgub.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGFhY3JnbHVhanV1dXNrZ3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDUzMTgsImV4cCI6MjEwNTAyMTMxOH0.8A6n78HcxYoBukL3Jsv7R-o1XpYrt09UuWds8y4RraM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
