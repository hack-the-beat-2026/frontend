import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium tracking-widest text-neutral-400">
        404
      </p>
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link
        to="/"
        className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        처음으로
      </Link>
    </main>
  )
}
