import type { NavLink } from '@/types'

export const CONTACT = {
  brand: 'Guiomar Gutiérrez Ardila',
  group: 'Grupo Empresarial',
  slogan: 'Un solo aliado estratégico, múltiples soluciones',
  email: 'comercialsyg1@gmail.com',
  phones: [
    { display: '316 225 2454', e164: '+573162252454' },
    { display: '311 587 97 38', e164: '+573115879738' },
  ],
  whatsappE164: '573162252454',
} as const

export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(message)}`
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Empresas', href: '#empresas' },
  { label: 'Puertas cortafuego', href: '#puertas-cortafuego' },
  { label: 'Brochures', href: '#brochures' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
]
