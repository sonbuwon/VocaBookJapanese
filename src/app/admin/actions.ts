'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StudyType } from '@/types'

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
