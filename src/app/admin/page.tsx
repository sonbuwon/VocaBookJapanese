import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSets } from '@/lib/data'
import AdminView from '@/components/AdminView'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.app_metadata?.role !== 'admin') redirect('/')

  const [wordSets, sentSets] = await Promise.all([
    getSets('word'),
    getSets('sent'),
  ])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <AdminView wordSets={wordSets} sentSets={sentSets} />
    </div>
  )
}
