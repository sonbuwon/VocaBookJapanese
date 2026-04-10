import { createClient } from '@/lib/supabase/client'

const MAX_HISTORY = 5

// ── 타입 ─────────────────────────────────────────────────────────────────────
export interface QuizHistoryItem {
  word_id?: string   // 즐겨찾기용 (구버전 내역엔 없을 수 있음)
  jp: string
  hira: string
  ko: string
  choices: string[]
  correctIndex: number
  selectedIndex: number
  isCorrect: boolean
}

export interface QuizHistoryEntry {
  id: string
  set_id: string | null
  set_name: string
  mode: 'hira' | 'meaning'
  score: number
  total: number
  questions: QuizHistoryItem[]
  created_at: string
}

// ── 저장 ─────────────────────────────────────────────────────────────────────
export async function saveQuizHistory(
  entry: Omit<QuizHistoryEntry, 'id' | 'created_at'>
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('quiz_history').insert({
    user_id: user.id,
    set_id: entry.set_id,
    set_name: entry.set_name,
    mode: entry.mode,
    score: entry.score,
    total: entry.total,
    questions: entry.questions,
  })
  if (error) return { error: error.message }

  // 5건 초과 시 오래된 것 삭제
  const { data: all } = await supabase
    .from('quiz_history')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (all && all.length > MAX_HISTORY) {
    const toDelete = all.slice(MAX_HISTORY).map((r: { id: string }) => r.id)
    await supabase.from('quiz_history').delete().in('id', toDelete)
  }

  return {}
}

// ── 조회 ─────────────────────────────────────────────────────────────────────
export async function getQuizHistory(): Promise<QuizHistoryEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quiz_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY)

  if (error) return []
  return (data ?? []) as QuizHistoryEntry[]
}
