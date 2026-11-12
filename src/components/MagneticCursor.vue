<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '@/utils/gsap'

/**
 * Cursor personalizado con dos capas:
 * - Punto: sigue al puntero casi 1:1.
 * - Anillo: interpolado (lerp) con inercia; se "imanta" a los elementos
 *   [data-magnetic] adoptando su tamaño y radio, y muestra etiquetas de
 *   [data-cursor-label].
 *
 * Los elementos magnéticos se desplazan hacia el puntero con
 * `gsap.quickTo` (sin crear tweens nuevos por evento). Todo corre sobre
 * `gsap.ticker`, el mismo bucle que Lenis y WebGL.
 */

interface MagneticTarget {
  readonly el: HTMLElement
  readonly strength: number
  readonly radius: number
  readonly xTo: gsap.QuickToFunc
  readonly yTo: gsap.QuickToFunc
}

interface Props {
  ringEase?: number
  dotEase?: number
}

const props = withDefaults(defineProps<Props>(), {
  ringEase: 0.16,
  dotEase: 0.55,
})

const enabled = ref(false)
const visible = ref(false)
const pressed = ref(false)
const hovering = ref(false)
const label = ref('')

const dotRef = ref<HTMLDivElement | null>(null)
const ringRef = ref<HTMLDivElement | null>(null)

const pointer = { x: -100, y: -100 }
const dot = { x: -100, y: -100 }
const ring = { x: -100, y: -100, w: 40, h: 40, r: 20 }
const ringTarget = { x: -100, y: -100, w: 40, h: 40, r: 20 }

const RING_SIZE = 40
const RING_HOVER_SIZE = 64
const RING_LABEL_SIZE = 96

let magnetic: MagneticTarget | null = null
const quickToCache = new WeakMap<HTMLElement, MagneticTarget>()
let pointerQuery: MediaQueryList | null = null
let motionQuery: MediaQueryList | null = null
let isTicking = false

function damp(current: number, target: number, ease: number, deltaMs: number): number {
  return current + (target - current) * (1 - Math.pow(1 - ease, deltaMs / (1000 / 60)))
}

function getMagneticTarget(el: HTMLElement): MagneticTarget {
  const cached = quickToCache.get(el)
  if (cached) return cached
  const raw = Number.parseFloat(el.dataset.magnetic ?? '')
  // Se mide el contenedor (estático) y se desplaza su hijo interno: si se
  // moviera el mismo elemento que se mide, su rect se realimentaría cada frame.
  const mover = el.querySelector<HTMLElement>(':scope > [data-magnetic-inner]') ?? el
  const target: MagneticTarget = {
    el,
    strength: Number.isFinite(raw) && raw > 0 ? raw : 0.35,
    // Se lee una sola vez: getComputedStyle por frame forzaría recálculo de estilos
    radius: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
    xTo: gsap.quickTo(mover, 'x', { duration: 0.6, ease: 'power3.out' }),
    yTo: gsap.quickTo(mover, 'y', { duration: 0.6, ease: 'power3.out' }),
  }
  quickToCache.set(el, target)
  return target
}

function releaseMagnetic(): void {
  if (!magnetic) return
  magnetic.xTo(0)
  magnetic.yTo(0)
  magnetic = null
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return
  pointer.x = event.clientX
  pointer.y = event.clientY
  if (!visible.value) {
    // Primer movimiento: teletransporta para no "volar" desde la esquina
    dot.x = ring.x = ringTarget.x = pointer.x
    dot.y = ring.y = ringTarget.y = pointer.y
    visible.value = true
  }
}

function onPointerOver(event: PointerEvent): void {
  const source = event.target
  if (!(source instanceof Element)) return

  const magneticEl = source.closest<HTMLElement>('[data-magnetic]')
  if (magneticEl !== magnetic?.el) {
    releaseMagnetic()
    if (magneticEl) magnetic = getMagneticTarget(magneticEl)
  }

  const labelled = source.closest<HTMLElement>('[data-cursor-label]')
  label.value = labelled?.dataset.cursorLabel ?? ''

  hovering.value =
    magneticEl !== null ||
    labelled !== null ||
    source.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor]') !== null
}

function onPointerLeaveWindow(event: PointerEvent): void {
  if (event.relatedTarget === null) {
    visible.value = false
    releaseMagnetic()
    label.value = ''
    hovering.value = false
  }
}

function onPointerDown(): void {
  pressed.value = true
}

function onPointerUp(): void {
  pressed.value = false
}

function computeRingTarget(): void {
  if (magnetic && magnetic.el.isConnected) {
    const rect = magnetic.el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = pointer.x - cx
    const dy = pointer.y - cy

    magnetic.xTo(dx * magnetic.strength)
    magnetic.yTo(dy * magnetic.strength)

    const padding = 10
    ringTarget.x = cx + dx * magnetic.strength
    ringTarget.y = cy + dy * magnetic.strength
    ringTarget.w = rect.width + padding * 2
    ringTarget.h = rect.height + padding * 2
    ringTarget.r = Math.min(magnetic.radius + padding, ringTarget.h / 2)
    return
  }

  if (magnetic && !magnetic.el.isConnected) magnetic = null

  const size = label.value ? RING_LABEL_SIZE : hovering.value ? RING_HOVER_SIZE : RING_SIZE
  ringTarget.x = pointer.x
  ringTarget.y = pointer.y
  ringTarget.w = size
  ringTarget.h = size
  ringTarget.r = size / 2
}

const tick = (_time: number, deltaMs: number): void => {
  const dotEl = dotRef.value
  const ringEl = ringRef.value
  if (!dotEl || !ringEl) return
  const dt = Math.min(deltaMs, 50)

  computeRingTarget()

  dot.x = damp(dot.x, pointer.x, props.dotEase, dt)
  dot.y = damp(dot.y, pointer.y, props.dotEase, dt)
  ring.x = damp(ring.x, ringTarget.x, props.ringEase, dt)
  ring.y = damp(ring.y, ringTarget.y, props.ringEase, dt)
  ring.w = damp(ring.w, ringTarget.w, 0.2, dt)
  ring.h = damp(ring.h, ringTarget.h, 0.2, dt)
  ring.r = damp(ring.r, ringTarget.r, 0.2, dt)

  const scale = pressed.value ? 0.86 : 1
  dotEl.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`
  ringEl.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${scale})`
  ringEl.style.width = `${ring.w}px`
  ringEl.style.height = `${ring.h}px`
  ringEl.style.borderRadius = `${ring.r}px`
}

function attach(): void {
  if (enabled.value) return
  enabled.value = true
  document.documentElement.classList.add('has-custom-cursor')
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerover', onPointerOver, { passive: true })
  document.addEventListener('pointerout', onPointerLeaveWindow, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  gsap.ticker.add(tick)
  isTicking = true
}

function detach(): void {
  if (!enabled.value) return
  enabled.value = false
  visible.value = false
  releaseMagnetic()
  document.documentElement.classList.remove('has-custom-cursor')
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerover', onPointerOver)
  document.removeEventListener('pointerout', onPointerLeaveWindow)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  if (isTicking) {
    gsap.ticker.remove(tick)
    isTicking = false
  }
}

/** Se activa solo con ratón real y sin preferencia de movimiento reducido */
function evaluate(): void {
  const canUse = (pointerQuery?.matches ?? false) && !(motionQuery?.matches ?? false)
  if (canUse) attach()
  else detach()
}

onMounted(() => {
  pointerQuery = window.matchMedia(FINE_POINTER_QUERY)
  motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  pointerQuery.addEventListener('change', evaluate)
  motionQuery.addEventListener('change', evaluate)
  evaluate()
})

onUnmounted(() => {
  pointerQuery?.removeEventListener('change', evaluate)
  motionQuery?.removeEventListener('change', evaluate)
  detach()
  // Devuelve los elementos magnéticos a su posición y limpia estilos inline
  document.querySelectorAll<HTMLElement>('[data-magnetic], [data-magnetic-inner]').forEach((el) => {
    gsap.killTweensOf(el)
    gsap.set(el, { clearProps: 'transform' })
  })
  pointerQuery = null
  motionQuery = null
})
</script>

<template>
  <div v-if="enabled" class="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
    <div
      ref="ringRef"
      class="gpu absolute top-0 left-0 flex items-center justify-center border border-white/70 mix-blend-difference transition-[opacity,background-color,border-color] duration-300"
      :class="[
        visible ? 'opacity-100' : 'opacity-0',
        label ? 'border-transparent bg-white' : hovering ? 'bg-white/10' : 'bg-transparent',
      ]"
      style="width: 40px; height: 40px; border-radius: 20px"
    >
      <span
        class="eyebrow text-[0.625rem] tracking-[0.2em] text-black transition-opacity duration-200"
        :class="label ? 'opacity-100' : 'opacity-0'"
      >
        {{ label }}
      </span>
    </div>
    <div
      ref="dotRef"
      class="gpu absolute top-0 left-0 size-1.5 rounded-full bg-white mix-blend-difference transition-[opacity,scale] duration-300"
      :class="visible && !hovering && !label ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
    />
  </div>
</template>
