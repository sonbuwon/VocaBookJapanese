import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPersonalSets } from '@/lib/data'
import MyWordsView from '@/components/MyWordsView'

export default async function MyWordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [wordSets, sentSets] = await Promise.all([
    getPersonalSets('word'),
    getPersonalSets('sent'),
  ])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <MyWordsView wordSets={wordSets} sentSets={sentSets} />
    </div>
  )
}
