import { cn } from '@/lib/utils'

export type PantallaMuro = { id: string | number; nombre: string; estado: string }

const ETIQUETA: Record<string, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo', SIN_CONEXION: 'Sin conexión' }

/**
 * Muro de pantallas: cada dispositivo se dibuja como una pantalla pequeña.
 * Activa = reproduce contenido (degradado en movimiento y barra de progreso); sin conexión = rayas ámbar
 * parpadeantes; inactiva = apagada. El movimiento se desactiva con prefers-reduced-motion.
 */
export function MuroPantallas({
  pantallas, max = 8, columnas = 4, decorativo = false, className,
}: { pantallas: PantallaMuro[]; max?: number; columnas?: 2 | 3 | 4 | 5 | 6; decorativo?: boolean; className?: string }) {
  const visibles = pantallas.slice(0, max)
  const resto = pantallas.length - visibles.length
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }[columnas]

  return (
    <div
      className={cn('grid gap-2', cols, className)}
      role={decorativo ? undefined : 'list'}
      aria-hidden={decorativo || undefined}
      aria-label={decorativo ? undefined : 'Estado de tus pantallas'}
    >
      {visibles.map((p, i) => (
        <div
          key={p.id}
          role={decorativo ? undefined : 'listitem'}
          aria-label={decorativo ? undefined : `${p.nombre}: ${ETIQUETA[p.estado] ?? p.estado}`}
          title={decorativo ? undefined : `${p.nombre} · ${ETIQUETA[p.estado] ?? p.estado}`}
          data-estado={p.estado}
          className="pantalla"
          style={{ ['--d' as string]: `${i * 0.7}s`, ['--e' as string]: `${i * 70}ms`, ['--h' as string]: 205 + ((i * 17) % 40) }}
        >
          <span className="pantalla-progreso" />
        </div>
      ))}
      {resto > 0 && (
        <div className="mono flex aspect-video items-center justify-center rounded-md bg-white/[0.04] text-xs text-muted-foreground ring-1 ring-white/10">
          +{resto}
        </div>
      )}
    </div>
  )
}
