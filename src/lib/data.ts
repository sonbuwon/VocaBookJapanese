import { createClient } from '@/lib/supabase/server'
import type { StudyType, WordSet, Word, DialogSetData } from '@/types'

export async function getSets(type: Exclude<StudyType, 'dialog'>): Promise<WordSet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sets')
    .select('*, words(count)')
    .eq('type', type)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((set: any) => ({
    ...set,
    word_count: set.words?.[0]?.count ?? 0,
    words: undefined,
  }))
}

export async function getDialogSets(): Promise<WordSet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sets')
    .select('*, dialog_lines(count)')
    .eq('type', 'dialog')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((set: any) => ({
    ...set,
    line_count: set.dialog_lines?.[0]?.count ?? 0,
    dialog_lines: undefined,
  }))
}

export async function getWords(setId: string): Promise<Word[]> {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
