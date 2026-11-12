import { createApp } from 'vue'
import '@fontsource/anton/latin-400.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import './style.css'
import App from './App.vue'
import { REDUCED_MOTION_QUERY } from '@/utils/gsap'

// La clase permite que el CSS muestre los títulos sin esperar a SplitText
const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)
const syncMotionClass = (): void => {
  document.documentElement.classList.toggle('reduced-motion', reducedMotion.matches)
}
syncMotionClass()
reducedMotion.addEventListener('change', syncMotionClass)

// Evita que el navegador restaure el scroll antes de que Lenis/ScrollTrigger midan
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createApp(App).mount('#app')
