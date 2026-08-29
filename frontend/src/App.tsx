import { useEffect, useState, type ReactNode } from 'react'
import { HiderDevApp } from './features/hider/dev/HiderDevApp'
import { installMockBackend } from './features/hider/mocks/mockBackend'
import SeekerMockPage from './features/seeker/pages/SeekerMockPage'
import './App.css'

type AppRoute = 'home' | 'hider' | 'seeker'

let mockBackendInstalled = false

function routeFromPath(pathname: string): AppRoute {
  if (pathname === '/hider' || pathname.startsWith('/game/')) {
    return 'hider'
  }

  if (pathname === '/seeker') {
    return 'seeker'
  }

  return 'home'
}

function navigate(pathname: string) {
  window.history.pushState({}, '', pathname)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function HomePage() {
  return (
    <main className="app-home">
      <header className="app-home__hero">
        <p className="app-home__eyebrow">CHAMELEON PARTY</p>
        <h1>오늘의 숨바꼭질을 시작해요</h1>
        <p>
          숨는 사람은 나만의 카드를 만들고, 찾는 사람은 QR로 흔적을 확인해요.
        </p>
      </header>

      <section className="app-home__roles" aria-labelledby="role-selection-title">
        <div className="app-home__section-heading">
          <p className="app-home__eyebrow">JOIN THE GAME</p>
          <h2 id="role-selection-title">어떤 역할로 참여할까요?</h2>
        </div>

        <div className="app-home__role-grid">
          <button
            className="role-card role-card--hider"
            type="button"
            onClick={() => navigate('/hider')}
          >
            <span className="role-card__icon" aria-hidden="true">
              ◌
            </span>
            <span className="role-card__body">
              <strong>숨는 사람</strong>
              <span>장소를 촬영하고 나만의 캐릭터를 만들어 숨겨요.</span>
            </span>
            <span className="role-card__arrow" aria-hidden="true">
              →
            </span>
          </button>

          <button
            className="role-card role-card--seeker"
            type="button"
            onClick={() => navigate('/seeker')}
          >
            <span className="role-card__icon" aria-hidden="true">
              ⌕
            </span>
            <span className="role-card__body">
              <strong>찾는 사람</strong>
              <span>숨겨진 카드를 찾고 QR을 스캔해 확인해요.</span>
            </span>
            <span className="role-card__arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </section>

      <p className="app-home__note">현재는 프론트 기능 확인을 위한 mock 게임으로 실행됩니다.</p>
    </main>
  )
}

function FeatureLayout({
  route,
  children,
}: {
  route: Exclude<AppRoute, 'home'>
  children: ReactNode
}) {
  const label = route === 'hider' ? '숨는 사람' : '찾는 사람'

  return (
    <div className="feature-layout">
      <header className="feature-layout__header">
        <button className="feature-layout__home" type="button" onClick={() => navigate('/')}>
          ← 역할 선택
        </button>
        <span className="feature-layout__title">{label}</span>
        <span className="feature-layout__brand">CHAMELEON PARTY</span>
      </header>
      {children}
    </div>
  )
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    // HiderDesignPage uses the real shared API client; this supplies its
    // development response while the frontend is not connected to a backend.
    if (!mockBackendInstalled) {
      installMockBackend()
      mockBackendInstalled = true
    }
  }, [])

  if (route === 'hider') {
    return (
      <FeatureLayout route="hider">
        <HiderDevApp />
      </FeatureLayout>
    )
  }

  if (route === 'seeker') {
    return (
      <FeatureLayout route="seeker">
        <SeekerMockPage />
      </FeatureLayout>
    )
  }

  return <HomePage />
}

export default App
