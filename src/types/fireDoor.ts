/** Tipos de dominio de "The Fire Door Experience". */

export type FireDoorChapterId = 'umbral' | 'apertura' | 'laberinto' | 'ingenieria' | 'resistencia' | 'aplicaciones' | 'conversion'

/** Panel complementario que acompaña al texto de cada capítulo */
export type FireDoorChapterPanel = 'none' | 'details' | 'ratings' | 'applications' | 'conversion'

export interface FireDoorChapter {
  readonly id: FireDoorChapterId
  readonly number: string
  readonly label: string
  readonly title: string
  readonly subtitle: string
  readonly microcopy?: string
  readonly panel: FireDoorChapterPanel
  /** Progreso global (0..1) en el que empieza el capítulo */
  readonly start: number
  /** Progreso global (0..1) en el que termina el capítulo */
  readonly end: number
  /** Imagen Gemini usada en el modo estático (sin WebGL o con movimiento reducido) */
  readonly image: FireDoorImage
}

export interface FireDoorImage {
  readonly src: string
  readonly srcSmall: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

/** Recorte (en %) de una fotografía dentro del collage de herrajes */
export interface CollageRegion {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface FireDoorComponentDetail {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly region: CollageRegion
}

export interface FireDoorRating {
  readonly minutes: number
}

export type FireDoorQuality = 'high' | 'low'

export type FireDoorMode = 'immersive' | 'static'

/** Estado de progreso compartido entre scroll, escena y HUD (no reactivo: se lee por frame) */
export interface FireDoorProgressState {
  /** Progreso que dicta ScrollTrigger */
  target: number
  /** Progreso suavizado que consumen cámara, puerta y HUD */
  current: number
}
