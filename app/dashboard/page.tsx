import Link from 'next/link'
import { getAllTables, getTokens, getTokenCount, type Token } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Key, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const tables = await getAllTables()
  const tokens = await getTokens(5)
  const tokenCount = await getTokenCount()

  const stats = [
    {
      title: 'Total Tables',
      value: tables.length,
      description: 'Database tables',
      icon: Database
    },
    {
      title: 'Total Tokens',
      value: tokenCount,
      description: 'Server tokens',
      icon: Key
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to TeamSpeak Admin Panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/tokens">
              <Button className="w-full justify-start" variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Add New Token
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/tables/tokens">
              <Button className="w-full justify-start" variant="outline">
                <Database className="mr-2 h-4 w-4" />
                View Tokens Table
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tokens</CardTitle>
            <CardDescription>
              Latest created server tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tokens found</p>
            ) : (
              <div className="space-y-2">
                {tokens.slice(0, 5).map((token: Token) => (
                  <div key={token.token_id} className="flex items-center justify-between text-sm">
                    <span className="font-mono truncate flex-1">
                      {token.token_key}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(token.token_created * 1000).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>
            Browse and manage TeamSpeak database tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {tables.slice(0, 12).map((table) => (
              <Link key={table} href={`/dashboard/tables/${table}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  <span className="truncate">{table}</span>
                </Button>
              </Link>
            ))}
          </div>
          {tables.length > 12 && (
            <p className="text-sm text-muted-foreground mt-4">
              And {tables.length - 12} more tables...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
