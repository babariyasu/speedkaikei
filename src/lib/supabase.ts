import { createClient } from '@supabase/supabase-js'

// Vite の環境変数は VITE_ プレフィックスが必要
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
