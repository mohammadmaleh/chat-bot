'use client'

import { Navbar, Footer } from '@chat-bot/ui'
import { useAuth, useLogout } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { mutate: logout } = useLogout()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              }
            : undefined
        }
        onLogoClick={() => router.push('/')}
        onSearchClick={() => router.push('/products')}
        onCartClick={() => router.push('/cart')}
        onFavoritesClick={() => router.push('/dashboard?tab=favorites')}
        onLoginClick={() => router.push('/login')}
        onLogoutClick={() => logout()}
        onProfileClick={() => router.push('/dashboard?tab=profile')}
        onDashboardClick={() => router.push('/dashboard')}
        onScraperClick={() => router.push('/scraper')}
        cartCount={0}
        favoritesCount={0}
      />
      
      <main className="flex-1">
        {children}
      </main>

      <Footer
        onNewsletterSubmit={async (email) => {
          console.log('Newsletter signup:', email)
          // TODO: Implement newsletter API
        }}
        socialLinks={{
          github: 'https://github.com',
          twitter: 'https://twitter.com',
          linkedin: 'https://linkedin.com',
        }}
      />
    </div>
  )
}
