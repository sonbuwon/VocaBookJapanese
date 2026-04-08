import { getSets, getDialogSets } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import type { WordSet } from '@/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let wordSets: WordSet[] = []
  let sentSets: WordSet[] = []
  let dialogSets: WordSet[] = []

  try {
    [wordSets, sentSets, dialogSets] = await Promise.all([
      getSets('word'),
      getSets('sent'),
      getDialogSets(),
    ])
  } catch (e) {
    console.error('Supabase 연결 오류:', e)
  }

  const isAdmin = user?.app_metadata?.role === 'admin'

  return (
    <AppShell
      initialWordSets={wordSets}
      initialSentSets={sentSets}
      initialDialogSets={dialogSets}
      userEmail={user?.email ?? ''}
      isAdmin={isAdmin}
    />
  )
}
