import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xibhmevisztsdlpueutj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYmhtZXZpc3p0c2RscHVldXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzkxMTEsImV4cCI6MjA2NjU1NTExMX0.NnKoDfqIinXqATfHAtdA-khC9Ea8ytNnzzUfkrwBgEg'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
})