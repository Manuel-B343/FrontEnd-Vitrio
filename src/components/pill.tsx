export const ESTADO_COLOR: Record<string, string> = {
  PROPUESTO: '#94a3b8', ANALISIS: '#fbbf24', APROBADO: '#34d399', PLANIFICACION: '#60a5fa', EJECUCION: '#3b82f6',
  SEGUIMIENTO: '#a78bfa', PAUSADO: '#fbbf24', CANCELADO: '#f87171', ACTIVA: '#34d399', INACTIVA: '#f87171',
  DEPRECADA: '#64748b', COMPLETADO: '#34d399', CERRADO: '#64748b', ACTIVO: '#34d399', INACTIVO: '#f87171',
  SIN_CONEXION: '#fbbf24', ADMINISTRADOR: '#818cf8', ADMINISTRADOR_CLIENTE: '#a78bfa', CLIENTE: '#60a5fa',
}

export function Pill({ value, text }: { value: string; text: string }) {
  const c = ESTADO_COLOR[value] ?? '#94a3b8'
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: c, background: c + '26', borderColor: c + '4d' }}
    >
      {text}
    </span>
  )
}
