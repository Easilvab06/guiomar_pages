import type { FunctionalComponent } from 'vue'
import type { LucideProps } from '@lucide/vue'

export type IconComponent = FunctionalComponent<LucideProps>

export type BrochureGroup = 'grupo' | 'soinsolar' | 'syg'

export interface Brochure {
  readonly id: string
  readonly title: string
  readonly group: BrochureGroup
  readonly src: string
  readonly thumb: string
  readonly width: number
  readonly height: number
}

export interface CompanyStat {
  readonly value: string
  readonly label: string
}

export interface Company {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly tagline: string
  readonly description: string
  readonly services: readonly string[]
  readonly icon: IconComponent
  /** Color de acento tomado del logotipo de cada marca */
  readonly accent: string
  readonly featured: boolean
  readonly stats?: readonly CompanyStat[]
  readonly brochureId?: string
  readonly website?: string
}

export interface FireDoorStep {
  readonly id: string
  readonly index: string
  readonly title: string
  readonly highlight: string
  readonly description: string
  readonly points: readonly string[]
  readonly icon: IconComponent
  readonly brochureId: string
}

export interface Regulation {
  readonly code: string
  readonly name: string
  readonly scope: string
}

export interface CompanyValue {
  readonly title: string
  readonly description: string
  readonly icon: IconComponent
}

export interface NavLink {
  readonly label: string
  readonly href: `#${string}`
}
