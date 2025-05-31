import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aaxmbdmzsyfgnzielkir.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheG1iZG16c3lmZ256aWVsa2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTQ1OTYsImV4cCI6MjA2MzQ3MDU5Nn0.wK38wo4DWuvpoQrdlJNwwTMUnq_dVo_qVH5dwRhn2D8';        

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
