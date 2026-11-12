<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowUpRight, Menu, X } from '@lucide/vue'
import BrandMark from '@/components/BrandMark.vue'
import BaseButton from '@/components/BaseButton.vue'
import { NAV_LINKS, whatsappLink } from '@/data/contact'
import { useSmoothScroll } from '@/utils/smoothScroll'
import { gsap, prefersReducedMotion } from '@/utils/gsap'

const smooth = useSmoothScroll()

const hidden = ref(false)
const scrolled = ref(false)
const menuOpen = ref(false)
const menuRef = ref<HTMLDivElement | null>(null)
const toggleRef = ref<HTMLButtonElement | null>(null)

let unsubscribe: (() => void) | null = null
let menuTimeline: gsap.core.Timeline | null = null

const quoteHref = whatsappLink('Hola, quiero solicitar una cotización con el Grupo Empresarial Guiomar Gutiérrez Ardila.')

function navigate(href: string): void {
  menuOpen.value = false
  smooth.scrollTo(href, { offset: -16 })
  history.replaceState(null, '', href)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    toggleRef.value?.focus()
  }
}

watch(menuOpen, async (open) => {
  if (open) smooth.stop()
  else smooth.start()

  await nextTick()
  const menu = menuRef.value
  if (!menu || prefersReducedMotion()) return

  menuTimeline?.kill()
  if (open) {
    menuTimeline = gsap
      .timeline()
      .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
      .from(menu.querySelectorAll('[data-menu-item]'), { yPercent: 110, stagger: 0.06, duration: 0.9 }, '-=0.35')
  }
})

onMounted(() => {
  unsubscribe = smooth.onScroll(({ scroll, direction }) => {
    scrolled.value = scroll > 24
    if (menuOpen.value) return
    if (scroll < 160) hidden.value = false
    else if (direction === 1) hidden.value = true
    else if (direction === -1) hidden.value = false
  })
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribe = null
  menuTimeline?.kill()
  menuTimeline = null
  window.removeEventListener('keydown', onKeydown)
  if (menuOpen.value) smooth.start()
})
</script>

<template>
  <header
    class="gpu fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-(--ease-out-expo)"
    :class="hidden ? '-translate-y-full' : 'translate-y-0'"
  >
    <div class="container-wide pt-3 sm:pt-4">
      <div
        class="flex h-(--header-h) items-center justify-between gap-6 rounded-2xl px-4 transition-[background-color,border-color,box-shadow] duration-500 sm:px-6"
        :class="scrolled || menuOpen ? 'glass' : 'border border-transparent'"
      >
        <a href="#inicio" class="shrink-0" aria-label="Ir al inicio" @click.prevent="navigate('#inicio')">
          <BrandMark />
        </a>

        <nav class="hidden lg:block" aria-label="Principal">
          <ul class="flex items-center gap-1">
            <li v-for="link in NAV_LINKS" :key="link.href">
              <a
                :href="link.href"
                class="relative rounded-full px-4 py-2 text-fluid-sm font-medium text-paper/75 transition-colors duration-300 hover:text-paper"
                @click.prevent="navigate(link.href)"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>

        <div class="flex items-center gap-3">
          <div class="hidden sm:block">
            <BaseButton :href="quoteHref" variant="primary" :magnetic="0.25">
              Cotizar
              <ArrowUpRight class="size-4" :stroke-width="2.25" aria-hidden="true" />
            </BaseButton>
          </div>
          <button
            ref="toggleRef"
            type="button"
            class="glass flex size-12 items-center justify-center rounded-full lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
            @click="menuOpen = !menuOpen"
          >
            <X v-if="menuOpen" class="size-5" aria-hidden="true" />
            <Menu v-else class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="menuOpen"
      id="mobile-menu"
      ref="menuRef"
      class="fixed inset-x-0 top-0 -z-10 flex min-h-dvh flex-col justify-between bg-ink-950 px-(--spacing-gutter) pt-32 pb-10 lg:hidden"
      data-lenis-prevent
    >
      <nav aria-label="Menú móvil">
        <ul class="flex flex-col gap-2">
          <li v-for="(link, i) in NAV_LINKS" :key="link.href" class="overflow-hidden">
            <a
              :href="link.href"
              data-menu-item
              class="display flex items-baseline gap-4 py-1 text-fluid-3xl text-paper"
              @click.prevent="navigate(link.href)"
            >
              <span class="font-sans text-fluid-xs font-bold text-brand-500">0{{ i + 1 }}</span>
              {{ link.label }}
            </a>
          </li>
        </ul>
      </nav>
      <BaseButton :href="quoteHref" variant="primary" size="lg">
        Solicitar cotización por WhatsApp
        <ArrowUpRight class="size-5" aria-hidden="true" />
      </BaseButton>
    </div>
  </header>
</template>
