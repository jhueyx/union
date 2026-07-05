// Union — reusable bottom-border input with label and error state.
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref
) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="block text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-2"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[
          'w-full bg-transparent px-0 py-2',
          'text-sm text-zinc-900 dark:text-zinc-50',
          'placeholder-zinc-400 dark:placeholder-zinc-600',
          'border-b',
          error
            ? 'border-red-400 dark:border-red-500'
            : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500',
          'focus:outline-none transition-colors duration-200',
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 tracking-wide">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
