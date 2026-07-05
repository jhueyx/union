// Union — reusable button. Renders as <a> when href is provided, else <button>.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  href?: string
  external?: boolean
  children: ReactNode
  className?: string
  onClick?: () => void
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  disabled?: boolean
}

const BASE =
  'inline-flex items-center justify-center rounded-[2px] font-medium tracking-[0.18em] uppercase transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50 disabled:opacity-40 disabled:pointer-events-none'

const SIZES: Record<Size, string> = {
  sm: 'text-[10px] px-5 py-2.5',
  md: 'text-xs px-7 py-3',
  lg: 'text-xs px-9 py-3.5',
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.08)] active:translate-y-0 active:shadow-none',
  secondary:
    'border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50',
  ghost:
    'text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  external,
  children,
  className = '',
  onClick,
  type = 'button',
  disabled,
}: ButtonProps) {
  const classes = [BASE, SIZES[size], VARIANTS[variant], className].join(' ')

  if (href) {
    const externalProps = external
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {}
    return (
      <a href={href} className={classes} {...externalProps}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}
