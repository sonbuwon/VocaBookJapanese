'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StudyType, DialogLine, DialogVocab, DialogExpression } from '@/types'

export async function createSet(name: string, type: StudyType) {
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('sets')
    .select('sort_order')
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0

  const { error } = await supabase
    .from('sets')
    .insert({ name: name.trim(), type, sort_order: maxOrder + 1 })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}

export async function renameSet(setId: string, newName: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sets')
    .update({ name: newName.trim() })
    .eq('id', setId)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteSet(setId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sets')
    .delete()
    .eq('id', setId)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}

export async function swapSetOrder(
  id1: string, order1: number,
  id2: string, order2: number,
) {
  const supabase = await createClient()

  const { error: e1 } = await supabase
    .from('sets')
    .update({ sort_order: order2 })
    .eq('id', id1)

  if (e1) return { error: e1.message }

  const { error: e2 } = await supabase
    .from('sets')
    .update({ sort_order: order1 })
    .eq('id', id2)

  if (e2) return { error: e2.message }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}

export async function addWords(
  setId: string,
  words: { jp: string; hira: string; ko: string }[],
) {
  if (words.length === 0) return { success: true, count: 0 }
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('words')
    .select('sort_order')
    .eq('set_id', setId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0

  const rows = words.map((w, i) => ({
    set_id: setId,
    jp: w.jp.trim(),
    hira: w.hira.trim(),
    ko: w.ko.trim(),
    sort_order: maxOrder + i + 1,
  }))

  const { error } = await supabase.from('words').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true, count: rows.length }
}

export async function addWord(setId: string, jp: string, hira: string, ko: string) {
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('words')
    .select('sort_order')
    .eq('set_id', setId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0

  const { error } = await supabase
    .from('words')
    .insert({ set_id: setId, jp: jp.trim(), hira: hira.trim(), ko: ko.trim(), sort_order: maxOrder + 1 })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateWord(wordId: string, jp: string, hira: string, ko: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('words')
    .update({ jp: jp.trim(), hira: hira.trim(), ko: ko.trim() })
    .eq('id', wordId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteWord(wordId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', wordId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ─── 대화 스크립트 어드민 액션 ───────────────────────────────────────────────

type DialogLineInput = { speaker: 'A' | 'B'; jp: string; hira: string; ko: string }
type DialogItemInput = { jp: string; hira: string; ko: string }

export async function addDialogLines(setId: string, lines: DialogLineInput[]) {
  if (lines.length === 0) return { success: true, count: 0 }
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('dialog_lines')
    .select('sort_order')
    .eq('set_id', setId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0
  const rows = lines.map((l, i) => ({
    set_id: setId,
    speaker: l.speaker,
    jp: l.jp.trim(),
    hira: l.hira.trim(),
    ko: l.ko.trim(),
    sort_order: maxOrder + i + 1,
  }))

  const { error } = await supabase.from('dialog_lines').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true, count: rows.length }
}

export async function updateDialogLine(
  id: string,
  speaker: 'A' | 'B',
  jp: string,
  hira: string,
  ko: string,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('dialog_lines')
    .update({ speaker, jp: jp.trim(), hira: hira.trim(), ko: ko.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteDialogLine(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dialog_lines').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function addDialogVocab(setId: string, items: DialogItemInput[]) {
  if (items.length === 0) return { success: true, count: 0 }
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('dialog_vocab')
    .select('sort_order')
    .eq('set_id', setId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0
  const rows = items.map((item, i) => ({
    set_id: setId,
    jp: item.jp.trim(),
    hira: item.hira.trim(),
    ko: item.ko.trim(),
    sort_order: maxOrder + i + 1,
  }))

  const { error } = await supabase.from('dialog_vocab').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true, count: rows.length }
}

export async function updateDialogVocab(id: string, jp: string, hira: string, ko: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('dialog_vocab')
    .update({ jp: jp.trim(), hira: hira.trim(), ko: ko.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteDialogVocab(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dialog_vocab').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function addDialogExpressions(setId: string, items: DialogItemInput[]) {
  if (items.length === 0) return { success: true, count: 0 }
  const supabase = await createClient()

  const { data: maxData } = await supabase
    .from('dialog_expressions')
    .select('sort_order')
    .eq('set_id', setId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0
  const rows = items.map((item, i) => ({
    set_id: setId,
    jp: item.jp.trim(),
    hira: item.hira.trim(),
    ko: item.ko.trim(),
    sort_order: maxOrder + i + 1,
  }))

  const { error } = await supabase.from('dialog_expressions').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true, count: rows.length }
}

export async function updateDialogExpression(id: string, jp: string, hira: string, ko: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('dialog_expressions')
    .update({ jp: jp.trim(), hira: hira.trim(), ko: ko.trim() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteDialogExpression(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('dialog_expressions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
