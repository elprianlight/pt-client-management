import { redirect } from 'next/navigation'

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams?: Promise<{ packageId?: string; clientId?: string }>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const params = new URLSearchParams()
  params.set('new', 'true')
  if (resolved?.packageId) params.set('packageId', resolved.packageId)
  if (resolved?.clientId) params.set('clientId', resolved.clientId)

  redirect(`/jadwal?${params.toString()}`)
}
