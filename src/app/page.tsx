import { getDefaultSets, getPersonalSets, getDialogSets } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import type { WordSet } from '@/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let defaultWordSets: WordSet[] = []
  let personalWordSets: WordSet[] = []
  let defaultSentSets: WordSet[] = []
  let personalSentSets: WordSet[] = []
  let dialogSets: WordSet[] = []

  try {
    ;[defaultWordSets, personalWordSets, defaultSentSets, personalSentSets, dialogSets] = await Promise.all([
      getDefaultSets('word'),
      getPersonalSets('word'),
      getDefaultSets('sent'),
      getPersonalSets('sent'),
      getDialogSets(),
    ])
  } catch (e) {
    console.error('Supabase 연결 오류:', e)
  }

  const isAdmin = user?.app_metadata?.role === 'admin'

  return (
    <AppShell
      initialDefaultWordSets={defaultWordSets}
      initialPersonalWordSets={personalWordSets}
      initialDefaultSentSets={defaultSentSets}
      initialPersonalSentSets={personalSentSets}
      initialDialogSets={dialogSets}
      userEmail={user?.email ?? ''}
      isAdmin={isAdmin}
    />
  )
}
