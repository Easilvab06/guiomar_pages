import type {
  FireDoorChapter,
  FireDoorComponentDetail,
  FireDoorImage,
  FireDoorRating,
} from '@/types/fireDoor'

const BASE = `${import.meta.env.BASE_URL}images/firedoor/`

function image(name: string, alt: string): FireDoorImage {
  return {
    src: `${BASE}${name}.webp`,
    srcSmall: `${BASE}${name}-768.webp`,
    alt,
    width: 1376,
    height: 768,
  }
}

/** Las seis imágenes Gemini en orden narrativo */
export const FIRE_DOOR_IMAGES = {
  doorClosed: image('01-door-closed', 'Puerta cortafuego de acero grafito cerrada en un muro de concreto a la vista, con barra antipánico y cierrapuertas.'),
  doorOpening: image('02-door-opening', 'La misma puerta cortafuego entreabierta, dejando ver la luz cálida del corredor interior.'),
  labyrinth: image('03-fire-labyrinth', 'Corredores de concreto en perspectiva con puertas cortafuego que separan compartimentos.'),
  hardware: image('04-door-hardware', 'Composición de seis fotografías de herrajes: bisagra, barra antipánico, cierrapuertas, sellos, marco y cerradura.'),
  installation: image('05-fire-installation', 'Corredor visto a través de una puerta doble abierta, con varias puertas cortafuego instaladas a lo largo de los muros.'),
  protectedBuilding: image('06-protected-building', 'Corredor corporativo iluminado con puertas cortafuego instaladas y ventanales al fondo.'),
} as const

/** Fin de la fase de apertura de la puerta (el resto del recorrido es el laberinto) */
export const DOOR_PHASE_END = 0.3

export const FIRE_DOOR_CHAPTERS: readonly FireDoorChapter[] = [
  {
    id: 'umbral',
    number: '01',
    label: 'El umbral',
    title: 'No todas las puertas son iguales.',
    subtitle: 'Algunas están diseñadas para proteger lo que más importa.',
    microcopy: 'Desplázate para descubrir.',
    panel: 'none',
    start: 0,
    end: 0.07,
    image: FIRE_DOOR_IMAGES.doorClosed,
  },
  {
    id: 'apertura',
    number: '02',
    label: 'La apertura',
    title: 'Una barrera contra el fuego.',
    subtitle: 'Una solución diseñada para contener la propagación del fuego y el humo durante un tiempo determinado.',
    panel: 'none',
    start: 0.07,
    end: DOOR_PHASE_END,
    image: FIRE_DOOR_IMAGES.doorOpening,
  },
  {
    id: 'laberinto',
    number: '03',
    label: 'El laberinto',
    title: 'La protección está en cada detalle.',
    subtitle: 'Cada compartimento cumple una función en la estrategia de seguridad de una edificación.',
    panel: 'none',
    start: DOOR_PHASE_END,
    end: 0.5,
    image: FIRE_DOOR_IMAGES.labyrinth,
  },
  {
    id: 'ingenieria',
    number: '04',
    label: 'La ingeniería',
    title: 'Precisión en cada componente.',
    subtitle: 'El rendimiento de una puerta depende de la correcta integración de todos sus componentes.',
    panel: 'details',
    start: 0.5,
    end: 0.66,
    image: FIRE_DOOR_IMAGES.hardware,
  },
  {
    id: 'resistencia',
    number: '05',
    label: 'Resistencia',
    title: 'El tiempo también protege.',
    subtitle: 'Seleccionamos soluciones según las exigencias de resistencia al fuego de cada proyecto.',
    panel: 'ratings',
    start: 0.66,
    end: 0.78,
    image: FIRE_DOOR_IMAGES.doorClosed,
  },
  {
    id: 'aplicaciones',
    number: '06',
    label: 'Aplicaciones',
    title: 'Protección para cada espacio.',
    subtitle: 'Hospitales, oficinas, hoteles, industrias: cada edificación tiene rutas de evacuación que proteger.',
    panel: 'applications',
    start: 0.78,
    end: 0.9,
    image: FIRE_DOOR_IMAGES.installation,
  },
  {
    id: 'conversion',
    number: '07',
    label: 'Conversión',
    title: 'La seguridad comienza con una decisión.',
    subtitle:
      'En S&G Soluciones Integrales te acompañamos en el suministro, instalación, mantenimiento y cumplimiento normativo de puertas cortafuego.',
    panel: 'conversion',
    start: 0.9,
    end: 1,
    image: FIRE_DOOR_IMAGES.protectedBuilding,
  },
]

/**
 * Componentes del collage 04 en el orden en que se presentan. Cada región
 * corresponde a una de las seis fotografías de la composición (grilla 3×2).
 * Las descripciones explican la función de cada pieza sin atribuirles
 * especificaciones ni certificaciones.
 */
export const FIRE_DOOR_COMPONENTS: readonly FireDoorComponentDetail[] = [
  {
    id: 'bisagras',
    name: 'Bisagras',
    description: 'Sostienen el peso de la hoja y guían su giro sobre el marco.',
    region: { left: 0, top: 0, width: 33.3, height: 50 },
  },
  {
    id: 'barra-antipanico',
    name: 'Barra antipánico',
    description: 'Permite abrir la puerta con un solo empuje en el sentido de evacuación.',
    region: { left: 33.3, top: 0, width: 33.4, height: 50 },
  },
  {
    id: 'cierrapuertas',
    name: 'Cierrapuertas',
    description: 'Devuelve la hoja a su posición cerrada después de cada paso.',
    region: { left: 66.7, top: 0, width: 33.3, height: 50 },
  },
  {
    id: 'cerraduras',
    name: 'Cerraduras',
    description: 'Mantienen la hoja asegurada contra el marco cuando está cerrada.',
    region: { left: 66.7, top: 50, width: 33.3, height: 50 },
  },
  {
    id: 'sellos',
    name: 'Sellos intumescentes',
    description: 'Ubicados en el perímetro de la hoja, ayudan a sellar las holguras frente al humo y el calor.',
    region: { left: 0, top: 50, width: 33.3, height: 50 },
  },
  {
    id: 'marcos',
    name: 'Marcos metálicos',
    description: 'Anclan el conjunto al muro y reciben los herrajes de la hoja.',
    region: { left: 33.3, top: 50, width: 33.4, height: 50 },
  },
]

export const FIRE_DOOR_RATINGS: readonly FireDoorRating[] = [{ minutes: 60 }, { minutes: 90 }, { minutes: 120 }]

export const FIRE_DOOR_RATING_NOTE =
  'Opciones de referencia. La resistencia de cada puerta se verifica según el modelo y su documentación técnica.'
