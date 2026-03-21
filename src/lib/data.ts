import { createClient } from '@/lib/supabase/server'
import type { StudyType, WordSet, Word } from '@/types'

export async function getSets(type: StudyType): Promise<WordSet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sets')
    .select('*, words(count)')
    .eq('type', type)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((set: any) => ({
    ...set,
    word_count: set.words?.[0]?.count ?? 0,
    words: undefined,
  }))
}

export async function getWords(setId: string): Promise<Word[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
