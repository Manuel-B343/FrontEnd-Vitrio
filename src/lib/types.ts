export type Rol = 'ADMINISTRADOR' | 'ADMINISTRADOR_CLIENTE' | 'CLIENTE'

export interface Perfil {
  id_usuario: number
  username: string
  email: string
  first_name: string
  last_name: string
  fecha_nacimiento: string | null
  rol: Rol
  id_cliente: number | null
  last_login: string | null
}

export const ROL_LABEL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  ADMINISTRADOR_CLIENTE: 'Administrador cliente',
  CLIENTE: 'Cliente',
}
