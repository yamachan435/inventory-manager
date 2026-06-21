import { createClient } from '@supabase/supabase-js'

// URLから/rest/v1/を除去（Supabaseクライアントが自動的に追加するため）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '') || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
