'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Token {
  token_id: number
  token_key: string
  token_type: number
  token_id1: number
  token_id2: number
  token_created: number
  token_description: string
}

interface TokenFormProps {
  initialTokens?: Token[]
}

export function TokenForm({ initialTokens = [] }: TokenFormProps) {
  const [tokenKey, setTokenKey] = useState('')
  const [tokens, setTokens] = useState<Token[]>(initialTokens)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenKey })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add token')
      }

      setTokens(data.tokens)
      setTokenKey('')
      setMessage({ type: 'success', text: data.message || 'Token added successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Token</CardTitle>
          <CardDescription>
            Create a new TeamSpeak token for server administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenKey">Token Key</Label>
              <Input
                id="tokenKey"
                type="text"
                placeholder="Enter token key (min 8 characters)"
                value={tokenKey}
                onChange={(e) => setTokenKey(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            {message && (
              <div className={`rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : 'bg-destructive/15 text-destructive'
              }`}>
                {message.text}
              </div>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Token'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tokens</CardTitle>
            <CardDescription>Last 10 created tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Token Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.token_id}>
                    <TableCell>{token.token_id}</TableCell>
                    <TableCell className="font-mono text-sm">{token.token_key}</TableCell>
                    <TableCell>{token.token_type}</TableCell>
                    <TableCell>{formatDate(token.token_created)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
