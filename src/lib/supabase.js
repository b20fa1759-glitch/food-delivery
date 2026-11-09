import { createClient } from '@supabase/supabase-js'

// Values come from the .env file (Vite only exposes variables that start with VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// One shared client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
