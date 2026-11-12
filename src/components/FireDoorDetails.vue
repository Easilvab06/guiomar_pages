<script setup lang="ts">
import { computed } from 'vue'
import { FIRE_DOOR_COMPONENTS, FIRE_DOOR_IMAGES } from '@/data/fireDoorExperience'

interface Props {
  activeIndex: number
  /** En modo compacto (HUD móvil) se omite la lista de descripciones */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { compact: false })

const emit = defineEmits<{
  select: [index: number]
}>()

const image = FIRE_DOOR_IMAGES.hardware
const active = computed(() => FIRE_DOOR_COMPONENTS[props.activeIndex] ?? FIRE_DOOR_COMPONENTS[0])
</script>

<template>
  <div class="flex flex-col gap-4">
    <figure class="relative overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-white/10">
      <img
        :src="image.src"
        :srcset="`${image.srcSmall} 768w, ${image.src} 1376w`"
        sizes="(min-width: 1024px) 40vw, 92vw"
        :width="image.width"
        :height="image.height"
        :alt="image.alt"
        loading="lazy"
        decoding="async"
        class="block h-auto w-full"
      />
      <!-- Foco: se atenúan las fotografías que no corresponden al componente activo -->
      <div
        v-for="(item, index) in FIRE_DOOR_COMPONENTS"
        :key="item.id"
        class="absolute transition-[background-color,box-shadow] duration-500"
        :class="
          index === activeIndex
            ? 'bg-transparent shadow-[inset_0_0_0_2px_var(--color-brand-500)]'
            : 'bg-ink-950/65'
        "
        :style="{
          left: `${item.region.left}%`,
          top: `${item.region.top}%`,
          width: `${item.region.width}%`,
          height: `${item.region.height}%`,
        }"
        aria-hidden="true"
      />
      <figcaption class="sr-only">
        Composición editorial de seis fotografías de herrajes. Componente destacado: {{ active?.name }}.
      </figcaption>
    </figure>

    <ol class="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3" aria-label="Componentes de la puerta">
      <li v-for="(item, index) in FIRE_DOOR_COMPONENTS" :key="item.id">
        <button
          type="button"
          class="flex min-h-11 w-full items-center gap-2 py-1 text-left text-fluid-xs transition-colors duration-300"
          :class="index === activeIndex ? 'font-bold text-paper' : 'text-paper/55 hover:text-paper'"
          :aria-current="index === activeIndex ? 'true' : undefined"
          @click="emit('select', index)"
        >
          <span
            class="font-display text-[0.8rem] tabular-nums"
            :class="index === activeIndex ? 'text-brand-500' : 'text-paper/40'"
            aria-hidden="true"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          {{ item.name }}
          <span v-if="index === activeIndex" class="sr-only">(seleccionado)</span>
        </button>
      </li>
    </ol>

    <p v-if="!compact" class="min-h-[3lh] text-fluid-sm leading-relaxed text-paper/75" aria-live="polite">
      <strong class="font-semibold text-paper">{{ active?.name }}.</strong>
      {{ active?.description }}
    </p>
  </div>
</template>
