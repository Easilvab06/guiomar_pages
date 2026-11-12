<script setup lang="ts">
import { computed } from 'vue'
import { useSmoothScroll } from '@/utils/smoothScroll'

type Variant = 'primary' | 'glass' | 'light' | 'outline-dark'
type Size = 'md' | 'lg'

interface Props {
  href: string
  variant?: Variant
  size?: Size
  magnetic?: number
  cursorLabel?: string
  download?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  magnetic: 0.3,
  cursorLabel: '',
  download: '',
})

const smooth = useSmoothScroll()

const isAnchor = computed(() => props.href.startsWith('#'))
const isExternal = computed(() => /^https?:\/\//.test(props.href))

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white shadow-[0_18px_40px_-14px_rgb(227_20_31/0.75)] group-hover:bg-brand-400',
  glass: 'glass text-white group-hover:bg-white/15',
  light: 'bg-paper text-ink-950 group-hover:bg-white',
  'outline-dark': 'border border-ink-950/20 text-ink-950 group-hover:border-ink-950 group-hover:bg-ink-950 group-hover:text-paper',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-12 px-6 text-fluid-sm',
  lg: 'h-14 px-8 text-fluid-base',
}

function onClick(event: MouseEvent): void {
  if (!isAnchor.value) return
  event.preventDefault()
  smooth.scrollTo(props.href, { offset: props.href === '#inicio' ? 0 : -16 })
  history.replaceState(null, '', props.href)
}
</script>

<template>
  <a
    :href="href"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
    :download="download || undefined"
    :data-magnetic="magnetic"
    :data-cursor-label="cursorLabel || undefined"
    class="group relative inline-flex rounded-full"
    @click="onClick"
  >
    <span
      data-magnetic-inner
      class="inline-flex items-center gap-3 rounded-full font-semibold tracking-tight whitespace-nowrap transition-[background-color,color,border-color] duration-300"
      :class="[VARIANT_CLASSES[variant], SIZE_CLASSES[size]]"
    >
      <slot />
    </span>
  </a>
</template>
