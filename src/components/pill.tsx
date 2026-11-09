export const ESTADO_COLOR: Record<string, string> = {
  PROPUESTO: '#94a3b8', ANALISIS: '#38bdf8', APROBADO: '#3b82f6', PLANIFICACION: '#22d3ee', EJECUCION: '#2563eb',
  SEGUIMIENTO: '#8b5cf6', PAUSADO: '#f59e0b', CANCELADO: '#ef4444', ACTIVA: '#10b981', INACTIVA: '#ef4444',
  DEPRECADA: '#64748b', COMPLETADO: '#10b981', CERRADO: '#64748b', ACTIVO: '#10b981', INACTIVO: '#64748b',
  SIN_CONEXION: '#f59e0b', ADMINISTRADOR: '#818cf8', ADMINISTRADOR_CLIENTE: '#a78bfa', CLIENTE: '#60a5fa',
}

const PULSAN = ['ACTIVO', 'ACTIVA']

export function Pill({ value, text }: { value: string; text: string }) {
  const c = ESTADO_COLOR[value] ?? '#94a3b8'
  return (
    <span
      className="mono inline-flex h-[22px] items-center gap-1.5 rounded-md border px-2 text-[0.68rem] font-medium uppercase tracking-[0.04em]"
      style={{ color: c, background: c + '1f', borderColor: c + '40' }}
    >
      <span
        className={`size-1.5 rounded-full ${PULSAN.includes(value) ? 'animate-[pulse-dot_1.6s_infinite]' : ''}`}
        style={{ background: c, boxShadow: `0 0 8px ${c}` }}
      />
      {text}
    </span>
  )
}
