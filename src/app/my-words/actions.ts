'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StudyType } from '@/types'

// 개인 세트 생성
export async function createPersonalSet(name: string, type: Exclude<StudyType, 'dialog'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: maxData } = await supabase
    .from('sets')
    .select('sort_order')
    .eq('type', type)
    .eq('is_default', false)
    .eq('owner_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxData?.[0]?.sort_order ?? 0

  const { error } = await supabase
    .from('sets')
    .insert({
      name: name.trim(),
      type,
      sort_order: maxOrder + 1,
      is_default: false,
      owner_id: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/my-words')
  return { success: true }
}

// 개인 세트 이름 변경 (RLS가 owner_id 소유권 검증)
export async function renamePersonalSet(setId: string, newName: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sets')
    .update({ name: newName.trim() })
    .eq('id', setId)
    .eq('is_default', false)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/my-words')
  return { success: true }
}

// 개인 세트 삭제 (RLS가 owner_id 소유권 검증)
export async function deletePersonalSet(setId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sets')
    .delete()
    .eq('id', setId)
    .eq('is_default', false)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/my-words')
  return { success: true }
}

// 개인 세트 순서 교체
export async function swapPersonalSetOrder(
  id1: string, order1: number,
  id2: string, order2: number,
) {
  const supabase = await createClient()

  const { error: e1 } = await supabase
    .from('sets')
    .update({ sort_order: order2 })
    .eq('id', id1)
    .eq('is_default', false)

  if (e1) return { error: e1.message }

  const { error: e2 } = await supabase
    .from('sets')
    .update({ sort_order: order1 })
    .eq('id', id2)
    .eq('is_default', false)

  if (e2) return { error: e2.message }

  revalidatePath('/')
  revalidatePath('/my-words')
  return { success: true }
}

// 단어 일괄 추가
export async function addPersonalWords(
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

  revalidatePath('/my-words')
  return { success: true, count: rows.length }
}

// 단어 단건 추가
export async function addPersonalWord(setId: string, jp: string, hira: string, ko: string) {
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
    .insert({
      set_id: setId,
      jp: jp.trim(),
      hira: hira.trim(),
      ko: ko.trim(),
      sort_order: maxOrder + 1,
    })

  if (error) return { error: error.message }

  revalidatePath('/my-words')
  return { success: true }
}

// 단어 수정
export async function updatePersonalWord(wordId: string, jp: string, hira: string, ko: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('words')
    .update({ jp: jp.trim(), hira: hira.trim(), ko: ko.trim() })
    .eq('id', wordId)

  if (error) return { error: error.message }

  revalidatePath('/my-words')
  return { success: true }
}

// 단어 삭제
export async function deletePersonalWord(wordId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', wordId)

  if (error) return { error: error.message }

  revalidatePath('/my-words')
  return { success: true }
}
