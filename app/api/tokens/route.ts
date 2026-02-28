import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insertToken, getTokens } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await getTokens(10)

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tokenKey } = body

    // Validasyon
    if (!tokenKey || typeof tokenKey !== 'string') {
      return NextResponse.json(
        { error: 'Token key is required' },
        { status: 400 }
      )
    }

    if (tokenKey.trim().length < 8) {
      return NextResponse.json(
        { error: 'Token key must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Token ekle
    await insertToken(tokenKey.trim())

    // Son tokenları getir
    const tokens = await getTokens(10)

    return NextResponse.json({
      success: true,
      message: 'Token added successfully',
      tokens
    })
  } catch (error) {
    console.error('Error adding token:', error)
    return NextResponse.json(
      { error: 'Failed to add token' },
      { status: 500 }
    )
  }
}
