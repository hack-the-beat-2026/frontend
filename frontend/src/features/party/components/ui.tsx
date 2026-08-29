import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

/**
 * Party Feature 전용 UI 조각.
 * 다른 Feature도 실제로 쓰게 되면 그때 shared/components로 올린다.
 * 처음부터 공용으로 만들지 않는다 (frontend_agent.md §8).
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
}

const VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-neutral-300',
  secondary:
    'bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300',
  ghost:
    'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:text-neutral-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-neutral-300',
} as const

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const sizing = size === 'lg' ? 'h-14 text-base' : 'h-11 text-sm'
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold transition disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl bg-white p-5 ring-1 ring-neutral-200 ${className}`}
    >
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-xl bg-neutral-50 px-4 text-base ring-1 ring-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {hint ? (
        <span className="mt-1 block text-xs text-neutral-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      {message}
    </p>
  )
}

export function PageShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-100">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-5">
        {title ? (
          <header className="pt-4">
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </main>
      {footer ? (
        <div className="sticky bottom-0 mx-auto w-full max-w-md bg-neutral-100/90 p-5 pt-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function CopyButton({
  value,
  label = '복사',
  className = '',
}: {
  value: string
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value)
      }}
      className={`shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white ${className}`}
    >
      {label}
    </button>
  )
}
