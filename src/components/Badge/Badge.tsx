import './Badge.scss'

type BadgeVariant = 'entry' | 'exit'

type BadgeProps = {
  variant: BadgeVariant
  label: string
}

export function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={
        variant === 'entry'
          ? 'badge badge--entry'
          : 'badge badge--exit'
      }
    >
      {label}
    </span>
  )
}
