import { createClient } from '@/lib/supabase/client'
import type { StudyType, Word } from '@/types'

export const FAVORITES_SET_ID = '__favorites__'

// 현재 세트 단어 중 즐겨찾기된 word_id 목록
export async function getFavoriteWordIds(wordIds: string[]): Promise<string[]> {
  if (wordIds.length === 0) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('user_favorites')
    .select('word_id')
    .in('word_id', wordIds)
  return data?.map(d => d.word_id as string) ?? []
}

// 타입별 즐겨찾기 단어 수
export async function getFavoritesCount(type: StudyType): Promise<number> {
  const supabase = createClient()

  const { data: favs } = await supabase.from('user_favorites').select('word_id')
  if (!favs?.length) return 0

  const { data: sets } = await supabase.from('sets').select('id').eq('type', type)
  if (!sets?.length) return 0

  const wordIds = favs.map(f => f.word_id as string)
  const setIds = sets.map(s => s.id as string)

  const { count } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .in('id', wordIds)
    .in('set_id', setIds)

  return count ?? 0
}

// 타입별 즐겨찾기 단어 전체 목록
export async function getFavoriteWords(type: StudyType): Promise<Word[]> {
  const supabase = createClient()

  const { data: favs } = await supabase
    .from('user_favorites')
    .select('word_id')
    .order('created_at', { ascending: true })

  if (!favs?.length) return []

  const { data: sets } = await supabase.from('sets').select('id').eq('type', type)
  if (!sets?.length) return []

  const wordIds = favs.map(f => f.word_id as string)
  const setIds = sets.map(s => s.id as string)

  const { data } = await supabase
    .from('words')
    .select('*')
    .in('id', wordIds)
    .in('set_id', setIds)
    .order('sort_order', { ascending: true })

  return data ?? []
}

// 즐겨찾기 토글 — 추가했으면 true, 제거했으면 false 반환
export async function toggleFavorite(wordId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('word_id', wordId)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_favorites').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('user_favorites').insert({ user_id: user.id, word_id: wordId })
    return true
  }
}
