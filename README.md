# Landing — Guiomar Gutiérrez Ardila · Grupo Empresarial

> Un solo aliado estratégico, múltiples soluciones.

Landing corporativa que presenta las 8 empresas que representa el grupo, con énfasis especial en
**S&G Soluciones Integrales — puertas cortafuego**, y una galería con todos los brochures.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Vue 3.5 (Composition API, `<script setup lang="ts">`) |
| Tipado | TypeScript 6 estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 (tokens en `@theme` → variables CSS, tipografía fluida con `clamp()`) |
| Motion | GSAP 3.15 (ScrollTrigger, Flip, Observer, SplitText) + Lenis 1.3 |
| 3D | Three.js r187 + shaders GLSL propios |
| Iconos | `@lucide/vue` (sucesor oficial de `lucide-vue-next`, misma API) |

## Uso

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # typecheck (vue-tsc) + build de producción en dist/
npm run preview    # sirve dist/
```

Requiere Node ≥ 20.19.

## Estructura

```
src/
├── App.vue                     Ensamblaje + proveedor de scroll suave
├── main.ts                     Fuentes, clase reduced-motion, montaje
├── style.css                   Design tokens, utilidades (glass, gpu, display…)
├── utils/
│   ├── gsap.ts                 Registro único de plugins + media queries
│   └── smoothScroll.ts         Clase SmoothScroll (Lenis ⇄ ScrollTrigger) + provide/inject
├── composables/
│   ├── useGsap.ts              gsap.matchMedia con scope y revert() en onUnmounted
│   ├── splitReveal.ts          Títulos divididos (SplitText con máscara y autoSplit)
│   └── useBrochureViewer.ts    Estado compartido del visor de brochures
├── shaders/
│   ├── vertex.glsl             Simplex 3D + domain warping + onda del cursor + normales analíticas
│   └── fragment.glsl           Gradiente por altura, Blinn-Phong, fresnel, viñeta, grano
├── components/
│   ├── HeroWebGLCanvas.vue     Seda líquida WebGL (carga diferida)
│   ├── MagneticCursor.vue      Cursor con lerp + imantación de [data-magnetic]
│   ├── ShowcaseSection.vue     8 empresas en paneles que se expanden (hover / tap)
│   ├── FireDoorsSection.vue    Sección destacada de puertas cortafuego
│   ├── BrochureGallery.vue     Galería con filtro animado con GSAP Flip
│   ├── BrochureLightbox.vue    Visor accesible (foco atrapado, teclado, descarga)
│   └── …                       Header, Hero, Marquee, About, Contact, Footer
├── data/                       Contenido (empresas, brochures, contacto)
└── assets/brochures/           Brochures en WebP (original + miniatura)
```

## Decisiones de ingeniería

**Un solo bucle de animación.** Lenis se crea con `autoRaf: false` y se alimenta desde
`gsap.ticker`; WebGL y el cursor también corren sobre `gsap.ticker`. Cada evento de scroll de Lenis
llama a `ScrollTrigger.update()` en el mismo frame y `lagSmoothing(0)` evita desfases tras pausar la
pestaña.

**Limpieza por componente con `revert()`, `killAll()` solo en la raíz.** Cada componente encapsula
sus animaciones en `gsap.matchMedia(scope)`; en `onUnmounted`, `mm.revert()` mata sus tweens,
ScrollTriggers, Observers y SplitText y restaura los estilos inline. `ScrollTrigger.killAll()` en un
componente hijo destruiría también los triggers de componentes hermanos que siguen montados, así que
se ejecuta únicamente al desmontar el proveedor raíz (`provideSmoothScroll`), como red de seguridad.

**WebGL.** Estado de Three.js fuera de la reactividad de Vue; el render se pausa fuera del viewport
(IntersectionObserver), con la pestaña oculta y ante pérdida de contexto; `pixelRatio` acotado a
1.75; segmentos de malla según el ancho; cero allocations por frame; lerp independiente del frame
rate. En `onUnmounted`: `geometry.dispose()`, `material.dispose()`, `renderer.dispose()` y
`forceContextLoss()`. Three.js se descarga en un chunk diferido para no bloquear el primer render.

**Accesibilidad.** Con `prefers-reduced-motion: reduce` se desactivan Lenis, el cursor
personalizado, los splits y el bucle WebGL (se pinta un frame estático). Los paneles son botones de
divulgación con `aria-expanded`; el visor atrapa el foco y responde a Esc / ← / →. El cursor
personalizado solo se activa con ratón (`hover: hover` y `pointer: fine`).

**Verificado.** `vue-tsc` estricto sin errores; montaje/desmontaje repetido (3 ciclos): 71
ScrollTriggers → 0, ticker balanceado, contexto WebGL liberado, SplitText revertido, sin listeners
acumulados.

## The Fire Door Experience (sección S&G · puertas cortafuego)

Recorrido de ~5,2 pantallas en escritorio (4 en móvil) con un escenario `sticky`. El scroll abre una
puerta cortafuego 3D sobre sus bisagras, la cámara cruza el umbral y recorre un laberinto
arquitectónico hasta una composición final iluminada. Siete capítulos:

| # | Capítulo | Progreso | Contenido |
| --- | --- | --- | --- |
| 01 | El umbral | 0–7 % | Puerta cerrada |
| 02 | La apertura | 7–30 % | La hoja gira: 20 % inicia · 40 % intermedia · 60 % ≈ 60° · 75 % = 90° · 100 % cruce del umbral |
| 03 | El laberinto | 30–50 % | Corredor A, compartimentos, puerta doble que se abre al acercarse |
| 04 | La ingeniería | 50–66 % | Collage 04: bisagras, barra antipánico, cierrapuertas, cerraduras, sellos, marcos |
| 05 | Resistencia | 66–78 % | 60 / 90 / 120 min como opciones de referencia |
| 06 | Aplicaciones | 78–90 % | Imágenes 05 y 06 + diez tipos de edificación |
| 07 | Conversión | 90–100 % | Solicitar cotización / Agendar inspección (WhatsApp real) |

### Archivos

```
src/components/FireDoorsSection.vue      Sección: experiencia + información de servicio (#puertas-cortafuego-info)
src/components/FireDoorExperience.vue    Orquestador: modo, calidad, montaje diferido de la escena, bucle
src/components/FireDoorScene.vue         Canvas + póster (imagen 01) mientras se construye la escena
src/components/FireDoorHUD.vue           Indicador de capítulo, progreso, barra, scroll, saltar, cotizar
src/components/FireDoorChapters.vue      Navegación por capítulos (mueve el scroll real)
src/components/FireDoorChapterContent.vue Texto y panel de cada capítulo (HUD y modo estático)
src/components/FireDoorDetails.vue       Collage de herrajes con foco por componente
src/composables/useFireDoorScroll.ts     Única fuente de progreso: 1 ScrollTrigger + 1 callback de ticker
src/composables/useFireDoorScene.ts      Renderer, ResizeObserver, pérdida de contexto, liberación
src/three/fireDoor/doorAssembly.ts       Puerta procedural (marco, pivote en bisagras, herrajes, cierrapuertas con cinemática)
src/three/fireDoor/labyrinth.ts          Arquitectura, puertas de compartimentos, luces
src/three/fireDoor/cameraRig.ts          Travelling por curvas Catmull-Rom centrípetas
src/three/fireDoor/world.ts              Escena, entorno PBR, curva de apertura, actualización por progreso
src/three/fireDoor/{materials,textures,geometry,motion}.ts
src/data/fireDoorExperience.ts           Capítulos, imágenes, componentes, resistencias
src/types/fireDoor.ts
public/images/firedoor/                  Las seis imágenes Gemini (WebP 1376 px + variante 768 px)
```

### Decisiones

- **Un solo progreso, un solo bucle.** `useFireDoorScroll` crea un único ScrollTrigger sobre el
  recorrido y registra un único callback en `gsap.ticker` (el mismo bucle que alimenta a Lenis).
  Escena y HUD leen el mismo valor en el mismo frame. Sin timelines con autoplay: la puerta se detiene
  cuando el scroll se detiene y se cierra al subir. El suavizado es exponencial (~0,1 s) e
  independiente del frame rate.
- **Peso de la hoja.** La apertura usa interpolación cúbica monótona entre los hitos del guion:
  velocidad continua, sin frenadas en cada hito y sin sobrepasos.
- **Solo rota la hoja.** `DoorLeafPivot` está en el eje vertical de las bisagras; marco, escena y
  cámara no rotan para simular la apertura. El brazo del cierrapuertas se resuelve por cinemática de
  dos eslabones en cada ángulo.
- **Render bajo demanda.** Solo se renderiza si cambió el progreso, el tamaño o el contexto; el bucle se
  detiene fuera del viewport y con la pestaña oculta. La escena se construye al acercarse a la sección.
- **Calidad.** Escritorio: sombras 1024 px, antialias, pixel ratio ≤ 1,75. Móvil/tablet: sin sombras,
  menos luces, texturas de 256 px, pixel ratio ≤ 1,25 y recorrido de cámara simplificado.
- **Respaldo.** Sin WebGL 2 o con `prefers-reduced-motion`, los siete capítulos se muestran como
  contenido estático con las imágenes Gemini. Ningún contenido depende del 3D.
- **Navegación.** Capítulos, herrajes y "Saltar experiencia" mueven el scroll real con Lenis; nunca
  la cámara directamente.

### Verificado

`npm run typecheck` y `npm run build` sin errores ni advertencias. En Chrome:

- **Recorrido:** se probó de ida y de vuelta; ir al 12 %, avanzar al 30 % y volver al 12 % reproduce la misma imagen.
- **Navegación:** la navegación por capítulos, el clic en herrajes y "Saltar experiencia" funcionan.
- **Móvil y respaldos:** se probó en móvil, con movimiento reducido y en un navegador sin WebGL.
- **Desmontaje:** se probaron 3 ciclos de montaje y desmontaje con la escena construida. ScrollTriggers, ticker y canvas vuelven a 0, se liberan los dos contextos WebGL por ciclo y los listeners no crecen.

## Contenido a validar con la cliente

- **Logo:** el monograma del header es una recreación vectorial; reemplazar por el SVG oficial.
- **Fichas de GVR, Roca, Ambientes Casablanca, LG Grass, Parques y Espacios Deportivos y Calizo:**
  redactadas a partir de los brochures (hay poca información pública de estas marcas). Confirmar
  servicios.
- **Soinsolar:** cifras tomadas de soinsolar.com (9 años, 500+ clientes, 7 MWp instalados o en
  ejecución).
- **Normativa S&G:** NSR-10, NFPA 80, NFPA 101, RETIE e ISO 9001 se citan tal como aparecen en el
  brochure de cumplimiento normativo.
- **Brochures:** imágenes de WhatsApp (≈1280 px). Si existen originales en mayor resolución,
  reemplazarlos en `src/assets/brochures/` con los mismos nombres.
- **Imágenes Gemini:** son de 1376 px. Si existen versiones de mayor resolución, reemplazarlas en
  `public/images/firedoor/` con los mismos nombres (y la variante `-768`).
