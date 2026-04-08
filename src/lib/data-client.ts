import { createClient } from '@/lib/supabase/client'
import type { Word, DialogSetData } from '@/types'

export async function getWords(setId: string): Promise<Word[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true })
    .limit(10000)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDialogSetData(setId: string): Promise<DialogSetData> {
  const supabase = createClient()
  const [linesRes, vocabRes, expressionsRes] = await Promise.all([
    supabase.from('dialog_lines').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
    supabase.from('dialog_vocab').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
    supabase.from('dialog_expressions').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
  ])

  if (linesRes.error) throw new Error(linesRes.error.message)
  if (vocabRes.error) throw new Error(vocabRes.error.message)
  if (expressionsRes.error) throw new Error(expressionsRes.error.message)

  return {
    lines: linesRes.data ?? [],
    vocab: vocabRes.data ?? [],
    expressions: expressionsRes.data ?? [],
  }
}
