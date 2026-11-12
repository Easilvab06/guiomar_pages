import type { Brochure, BrochureGroup } from '@/types'

import grupoSoluciones from '@/assets/brochures/grupo-soluciones.webp'
import grupoSolucionesThumb from '@/assets/brochures/grupo-soluciones-thumb.webp'
import grupoQuienesSomos from '@/assets/brochures/grupo-quienes-somos.webp'
import grupoQuienesSomosThumb from '@/assets/brochures/grupo-quienes-somos-thumb.webp'
import grupoMisionVision from '@/assets/brochures/grupo-mision-vision.webp'
import grupoMisionVisionThumb from '@/assets/brochures/grupo-mision-vision-thumb.webp'
import grupoPortafolio from '@/assets/brochures/grupo-portafolio.webp'
import grupoPortafolioThumb from '@/assets/brochures/grupo-portafolio-thumb.webp'
import soinsolar from '@/assets/brochures/soinsolar.webp'
import soinsolarThumb from '@/assets/brochures/soinsolar-thumb.webp'
import sgPuertas from '@/assets/brochures/sg-puertas-cortafuego.webp'
import sgPuertasThumb from '@/assets/brochures/sg-puertas-cortafuego-thumb.webp'
import sgSuministro from '@/assets/brochures/sg-suministro.webp'
import sgSuministroThumb from '@/assets/brochures/sg-suministro-thumb.webp'
import sgInstalacion from '@/assets/brochures/sg-instalacion.webp'
import sgInstalacionThumb from '@/assets/brochures/sg-instalacion-thumb.webp'
import sgMantenimiento from '@/assets/brochures/sg-mantenimiento.webp'
import sgMantenimientoThumb from '@/assets/brochures/sg-mantenimiento-thumb.webp'
import sgNormativo from '@/assets/brochures/sg-cumplimiento-normativo.webp'
import sgNormativoThumb from '@/assets/brochures/sg-cumplimiento-normativo-thumb.webp'
import sgBanner from '@/assets/brochures/sg-banner.webp'
import sgBannerThumb from '@/assets/brochures/sg-banner-thumb.webp'

export const BROCHURE_GROUP_LABELS: Readonly<Record<BrochureGroup | 'all', string>> = {
  all: 'Todos',
  grupo: 'Grupo empresarial',
  soinsolar: 'Soinsolar',
  syg: 'S&G · Puertas cortafuego',
}

export const BROCHURES: readonly Brochure[] = [
  { id: 'grupo-soluciones', title: 'Nuestras soluciones — 8 empresas', group: 'grupo', src: grupoSoluciones, thumb: grupoSolucionesThumb, width: 846, height: 1280 },
  { id: 'sg-puertas-cortafuego', title: 'S&G — Puertas cortafuego', group: 'syg', src: sgPuertas, thumb: sgPuertasThumb, width: 853, height: 1280 },
  { id: 'soinsolar', title: 'Soinsolar — Energía solar', group: 'soinsolar', src: soinsolar, thumb: soinsolarThumb, width: 840, height: 1280 },
  { id: 'grupo-quienes-somos', title: 'Quiénes somos', group: 'grupo', src: grupoQuienesSomos, thumb: grupoQuienesSomosThumb, width: 870, height: 1280 },
  { id: 'sg-suministro', title: 'S&G — Suministro de puertas cortafuego', group: 'syg', src: sgSuministro, thumb: sgSuministroThumb, width: 853, height: 1280 },
  { id: 'sg-instalacion', title: 'S&G — Instalación profesional', group: 'syg', src: sgInstalacion, thumb: sgInstalacionThumb, width: 853, height: 1280 },
  { id: 'sg-banner', title: 'S&G — Suministro, instalación y mantenimiento', group: 'syg', src: sgBanner, thumb: sgBannerThumb, width: 1280, height: 853 },
  { id: 'grupo-mision-vision', title: 'Misión, visión y valores', group: 'grupo', src: grupoMisionVision, thumb: grupoMisionVisionThumb, width: 844, height: 1280 },
  { id: 'sg-mantenimiento', title: 'S&G — Mantenimiento preventivo y correctivo', group: 'syg', src: sgMantenimiento, thumb: sgMantenimientoThumb, width: 853, height: 1280 },
  { id: 'sg-cumplimiento-normativo', title: 'S&G — Cumplimiento normativo', group: 'syg', src: sgNormativo, thumb: sgNormativoThumb, width: 853, height: 1280 },
  { id: 'grupo-portafolio', title: 'Portafolio del grupo', group: 'grupo', src: grupoPortafolio, thumb: grupoPortafolioThumb, width: 863, height: 1280 },
]

export function findBrochure(id: string): Brochure | undefined {
  return BROCHURES.find((b) => b.id === id)
}

export function requireBrochure(id: string): Brochure {
  const brochure = findBrochure(id)
  if (!brochure) throw new Error(`[brochures] No existe el brochure "${id}"`)
  return brochure
}
