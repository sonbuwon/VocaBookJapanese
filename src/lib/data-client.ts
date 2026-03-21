import { createClient } from '@/lib/supabase/client'
import type { Word } from '@/types'

export async function getWords(setId: string): Promise<Word[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
