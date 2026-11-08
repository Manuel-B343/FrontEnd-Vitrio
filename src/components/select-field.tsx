import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface Option { value: string; label: string }

export function SelectField({
  value, onChange, options, placeholder = 'Seleccionar…', allowEmpty, className, id,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  allowEmpty?: boolean
  className?: string
  id?: string
}) {
  const items = allowEmpty ? [{ value: '', label: 'Ninguno' }, ...options] : options
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string | null) ?? '')} items={items}>
      <SelectTrigger id={id} className={className ?? 'w-full'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
