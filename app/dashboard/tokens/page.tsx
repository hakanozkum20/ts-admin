import { TokenForm } from '@/components/token-form'
import { getTokens, type Token } from '@/lib/db'

export default async function TokensPage() {
  const tokens = await getTokens(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tokens</h1>
        <p className="text-muted-foreground">
          Create and manage TeamSpeak server tokens
        </p>
      </div>
      <TokenForm initialTokens={tokens} />
    </div>
  )
}
