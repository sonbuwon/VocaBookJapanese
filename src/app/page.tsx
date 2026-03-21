import { getSets } from '@/lib/data'
import AppShell from '@/components/AppShell'
import type { WordSet } from '@/types'

export default async function Home() {
  let wordSets: WordSet[] = []
  let sentSets: WordSet[] = []

  try {
    [wordSets, sentSets] = await Promise.all([
      getSets('word'),
      getSets('sent'),
    ])
  } catch (e) {
    console.error('Supabase 연결 오류:', e)
  }

  return <AppShell initialWordSets={wordSets} initialSentSets={sentSets} />
}
