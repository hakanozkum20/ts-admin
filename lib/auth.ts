import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Login attempt:', credentials?.username)

        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        const adminUsername = process.env.ADMIN_USERNAME || 'admin'
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || ''

        console.log('Expected username:', adminUsername)
        console.log('Hash from env:', adminPasswordHash)
        console.log('Hash length:', adminPasswordHash.length)
        console.log('Hash exists:', !!adminPasswordHash)

        if (credentials.username !== adminUsername) {
          console.log('Username mismatch')
          return null
        }

        console.log('Comparing password...')
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          adminPasswordHash
        )

        console.log('Password valid:', isValidPassword)

        if (!isValidPassword) {
          console.log('Invalid password')
          return null
        }

        console.log('Login successful')
        return {
          id: '1',
          name: adminUsername,
          email: `${adminUsername}@admin.local`
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
