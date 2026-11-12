import {
  Award,
  ClipboardCheck,
  Flame,
  Gem,
  Handshake,
  House,
  Lightbulb,
  Mountain,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Sun,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
  Zap,
} from '@lucide/vue'
import type { Company, CompanyValue, FireDoorStep, Regulation } from '@/types'

export const COMPANIES: readonly Company[] = [
  {
    id: 'soinsolar',
    name: 'Soinsolar',
    category: 'Energía solar',
    tagline: 'Energía limpia, un mejor mañana.',
    description:
      'Diseña e implementa sistemas fotovoltaicos para viviendas, empresas, industrias y proyectos especiales: menos costos de energía desde el primer día, menor huella de carbono y verdadera independencia energética.',
    services: [
      'Sistemas solares conectados a red, autónomos e híbridos',
      'Bombeo e iluminación solar',
      'Estaciones de carga para vehículos eléctricos',
      'Diseño eléctrico, eficiencia energética y mantenimiento',
    ],
    icon: Sun,
    accent: '#f5b700',
    featured: false,
    stats: [
      { value: '9', label: 'años de experiencia' },
      { value: '500+', label: 'clientes atendidos' },
      { value: '7 MWp', label: 'instalados o en ejecución' },
    ],
    brochureId: 'soinsolar',
    website: 'https://soinsolar.com',
  },
  {
    id: 'gvr',
    name: 'GVR',
    category: 'Transformadores',
    tagline: 'Potencia que mueve proyectos.',
    description:
      'Transformadores de potencia y de distribución eléctrica para proyectos residenciales, comerciales e industriales, con el respaldo técnico que exige una red confiable.',
    services: [
      'Transformadores de potencia',
      'Transformadores de distribución',
      'Suministro para proyectos industriales y comerciales',
      'Acompañamiento técnico en la selección del equipo',
    ],
    icon: Zap,
    accent: '#e3141f',
    featured: false,
  },
  {
    id: 'roca',
    name: 'Roca',
    category: 'Mármoles y baldosas',
    tagline: 'La nobleza de la piedra, en cada superficie.',
    description:
      'Pisos y fachadas en mármol, cerámica y porcelanato para proyectos que buscan durabilidad y un acabado de alto nivel.',
    services: [
      'Mármol para pisos, muros y fachadas',
      'Cerámica y porcelanato',
      'Acabados para proyectos residenciales y corporativos',
      'Asesoría en selección de materiales',
    ],
    icon: Gem,
    accent: '#a07a55',
    featured: false,
  },
  {
    id: 'casablanca',
    name: 'Ambientes Casablanca',
    category: 'Gres para pisos y fachadas',
    tagline: 'Espacios únicos, hechos para durar.',
    description:
      'Pisos y fachadas en gres que combinan resistencia y estética para interiores y exteriores con carácter propio.',
    services: [
      'Pisos en gres para alto tráfico',
      'Revestimientos de fachada',
      'Soluciones para interiores y exteriores',
      'Acompañamiento en el diseño del espacio',
    ],
    icon: House,
    accent: '#8a5a35',
    featured: false,
  },
  {
    id: 'lg-grass',
    name: 'LG Grass S.A.S.',
    category: 'Gramas sintéticas',
    tagline: 'Verde todo el año, sin desgaste.',
    description:
      'Gramas sintéticas para espacios verdes, deportivos y decorativos: superficies de bajo mantenimiento que se ven bien en cualquier clima.',
    services: [
      'Gramas para canchas y escenarios deportivos',
      'Gramas decorativas y paisajismo',
      'Zonas verdes para conjuntos y empresas',
      'Instalación y mantenimiento',
    ],
    icon: Sprout,
    accent: '#2f9a3e',
    featured: false,
  },
  {
    id: 'parques',
    name: 'Parques y Espacios Deportivos',
    category: 'Infraestructura deportiva',
    tagline: 'Lugares para encontrarse y moverse.',
    description:
      'Equipamiento urbano y recreativo para parques, conjuntos residenciales, colegios y entidades públicas.',
    services: [
      'Parques infantiles y biosaludables',
      'Canchas y escenarios deportivos',
      'Mobiliario y equipamiento urbano',
      'Proyectos recreativos a la medida',
    ],
    icon: Trophy,
    accent: '#1f62b3',
    featured: false,
  },
  {
    id: 'calizo',
    name: 'Calizo',
    category: 'Piedra natural',
    tagline: 'Arquitectura con textura propia.',
    description:
      'Concreto arquitectónico y mobiliario en piedra natural que aportan carácter y permanencia a fachadas, zonas comunes y espacio público.',
    services: [
      'Concreto arquitectónico',
      'Mobiliario en piedra natural',
      'Revestimientos y enchapes',
      'Piezas a la medida para proyectos',
    ],
    icon: Mountain,
    accent: '#b9a98f',
    featured: false,
  },
  {
    id: 'syg',
    name: 'S&G Soluciones Integrales',
    category: 'Puertas cortafuego',
    tagline: 'Protección que salva vidas.',
    description:
      'Especialistas en protección contra incendios: suministro, instalación y mantenimiento de puertas cortafuego certificadas que contienen el fuego y el humo y aseguran rutas de evacuación.',
    services: [
      'Suministro de puertas cortafuego certificadas',
      'Instalación profesional bajo norma',
      'Mantenimiento preventivo y correctivo',
      'Inspección y cumplimiento normativo',
    ],
    icon: Flame,
    accent: '#e3141f',
    featured: true,
    stats: [{ value: '60 · 90 · 120', label: 'min · opciones de resistencia al fuego' }],
    brochureId: 'sg-puertas-cortafuego',
  },
]

export const FIRE_DOOR_STEPS: readonly FireDoorStep[] = [
  {
    id: 'suministro',
    index: '01',
    title: 'Suministro',
    highlight: 'de puertas cortafuego',
    description:
      'Proveemos puertas cortafuego de alta calidad, certificadas y listas para instalar, en la variedad de modelos y medidas que tu proyecto necesita.',
    points: ['Alto estándar de calidad', 'Variedad de modelos y medidas', 'Productos certificados'],
    icon: PackageCheck,
    brochureId: 'sg-suministro',
  },
  {
    id: 'instalacion',
    index: '02',
    title: 'Instalación',
    highlight: 'profesional',
    description:
      'Instalamos con los más altos estándares de seguridad: personal técnico calificado, procedimientos bajo norma y garantía en cada proyecto.',
    points: ['Personal calificado y certificado', 'Instalación bajo norma', 'Garantía en cada proyecto'],
    icon: Wrench,
    brochureId: 'sg-instalacion',
  },
  {
    id: 'mantenimiento',
    index: '03',
    title: 'Mantenimiento',
    highlight: 'preventivo y correctivo',
    description:
      'Una puerta cortafuego solo protege si funciona el día que se necesita. Inspeccionamos, ajustamos y reparamos para que cierre, selle y resista siempre.',
    points: [
      'Inspecciones periódicas para prevenir fallas',
      'Corrección de fallas y restablecimiento del funcionamiento',
      'Prolongación de la vida útil',
    ],
    icon: ShieldCheck,
    brochureId: 'sg-mantenimiento',
  },
  {
    id: 'normativo',
    index: '04',
    title: 'Cumplimiento',
    highlight: 'normativo',
    description:
      'Verificamos y certificamos cada instalación para que tu edificio cumpla las normas nacionales e internacionales y proteja a sus ocupantes con tranquilidad y respaldo legal.',
    points: ['Cumplimiento garantizado', 'Inspección y certificación', 'Protección para tu edificio'],
    icon: ClipboardCheck,
    brochureId: 'sg-cumplimiento-normativo',
  },
]

export const REGULATIONS: readonly Regulation[] = [
  { code: 'NSR-10', name: 'Título J', scope: 'Requisitos de protección contra incendios en edificaciones en Colombia.' },
  { code: 'NFPA 80', name: 'Puertas y aberturas', scope: 'Instalación, inspección y mantenimiento de puertas cortafuego.' },
  { code: 'NFPA 101', name: 'Seguridad humana', scope: 'Medios de egreso y rutas de evacuación seguras.' },
  { code: 'RETIE', name: 'Reglamento eléctrico', scope: 'Requisitos técnicos para instalaciones eléctricas.' },
  { code: 'ISO 9001', name: 'Gestión de calidad', scope: 'Procesos controlados y mejora continua.' },
]

export const FIRE_DOOR_USES: readonly string[] = [
  'Hospitales',
  'Clínicas',
  'Edificios corporativos',
  'Hoteles',
  'Centros comerciales',
  'Instalaciones industriales',
  'Instituciones educativas',
  'Parqueaderos',
  'Edificios residenciales',
  'Cuartos técnicos y eléctricos',
]

export const COMPANY_VALUES: readonly CompanyValue[] = [
  { title: 'Confianza', description: 'Construimos relaciones sólidas y duraderas.', icon: Handshake },
  { title: 'Compromiso', description: 'Trabajamos con responsabilidad y pasión en cada proyecto.', icon: Users },
  { title: 'Calidad', description: 'Ofrecemos productos y servicios que superan expectativas.', icon: Award },
  { title: 'Innovación', description: 'Buscamos siempre nuevas formas de hacer las cosas mejor.', icon: Lightbulb },
  { title: 'Respaldo', description: 'Contamos con marcas líderes y un equipo experto.', icon: TrendingUp },
]
