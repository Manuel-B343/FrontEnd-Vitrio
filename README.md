# Vitrio – Frontend

React + Vite + TypeScript + [shadcn/ui](https://ui.shadcn.com) (Tailwind v4) para el backend [vitrio-app](https://github.com/SAMUELIBANEZZ/vitrio-app).

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:8000
npm run dev              # http://localhost:5173 (origen ya permitido por CORS en desarrollo)
```

## Estructura

- `src/lib/api.ts` – cliente HTTP: Bearer, renovación **única y compartida** tras un 401 (el refresh es de un solo uso), errores `{error:{...}}`.
- `src/lib/auth.tsx` – sesión (login, logout, perfil).
- `src/components/resource-page.tsx` – CRUD genérico: búsqueda `?search=`, orden, paginación, formulario con errores por campo, borrado.
- `src/pages/resources.tsx` – configuración de clientes, usuarios, proyectos, plantillas, archivos y dispositivos (permisos por rol, token de dispositivo mostrado una vez, rotar token, eventos, restablecer contraseña).
- `src/pages/{login,dashboard,profile}.tsx` – acceso, resumen y perfil/cambio de contraseña.

Los permisos del front solo ocultan opciones; la regla real la aplica el servidor.
