// Shared primitives for the admin planning pages.
//
// The admin area is deliberately dark (bg-[#0a0a0a]) — it is a working tool for
// two people, not part of the guest-facing site, which is light-only. Keep the
// palette here tuned for that dark surface: zinc-400/500 read well on near
// black, zinc-600 does not.
import type { ReactNode } from 'react'

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-8">
      <h1 className="text-xl font-[300] tracking-[0.1em] text-zinc-50">{title}</h1>
      {action}
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">{children}</p>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-zinc-800 rounded-[2px] p-5 bg-zinc-950 ${className}`}>
      {children}
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <Panel>
      <Label>{label}</Label>
      <p className={['text-3xl font-[300] tabular-nums', accent ?? 'text-zinc-50'].join(' ')}>
        {value}
      </p>
    </Panel>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'bg-transparent border border-zinc-800 rounded-[2px] px-3 py-2 text-sm text-zinc-50 ' +
        'placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors ' +
        (props.className ?? '')
      }
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        'bg-transparent border border-zinc-800 rounded-[2px] px-3 py-2 text-sm text-zinc-50 ' +
        'focus:outline-none focus:border-zinc-600 transition-colors ' +
        (props.className ?? '')
      }
    />
  )
}

export function Btn({
  children, variant = 'ghost', ...rest
}: { children: ReactNode; variant?: 'primary' | 'ghost' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-zinc-50 text-zinc-900 hover:bg-white',
    ghost: 'border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:border-zinc-600',
    danger: 'text-rose-400 hover:text-rose-300',
  }[variant]
  return (
    <button
      {...rest}
      className={`text-[10px] tracking-[0.15em] uppercase px-3 py-2 rounded-[2px] transition-colors ${styles} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500 py-8 text-center">{children}</p>
}
