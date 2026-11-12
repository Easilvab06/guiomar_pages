<script setup lang="ts">
import type { FireDoorChapter } from '@/types/fireDoor'

interface Props {
  chapters: readonly FireDoorChapter[]
  activeIndex: number
}

defineProps<Props>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <nav aria-label="Capítulos de la experiencia">
    <ol class="flex flex-row gap-0.5 lg:flex-col lg:items-end">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <button
          type="button"
          class="group flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 rounded-full py-1 transition-colors duration-300 lg:flex-row lg:gap-3 lg:pr-1 lg:pl-3 lg:text-right"
          :aria-current="index === activeIndex ? 'step' : undefined"
          :aria-label="`Ir al capítulo ${chapter.number}: ${chapter.label}`"
          @click="emit('select', index)"
        >
          <!-- La etiqueta del capítulo activo es siempre visible: el estado no depende solo del color -->
          <span
            class="eyebrow hidden text-[0.625rem] whitespace-nowrap transition-opacity duration-300 lg:inline"
            :class="
              index === activeIndex
                ? 'text-paper opacity-100'
                : 'text-paper/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            "
          >
            {{ chapter.label }}
          </span>
          <span
            class="font-display text-[0.8rem] tabular-nums transition-colors duration-300"
            :class="index === activeIndex ? 'text-paper' : 'text-paper/45 group-hover:text-paper'"
            aria-hidden="true"
          >
            {{ chapter.number }}
          </span>
          <span
            class="h-0.5 rounded-full transition-[width,background-color] duration-500"
            :class="index === activeIndex ? 'w-8 bg-brand-500' : index < activeIndex ? 'w-3 bg-paper/60' : 'w-3 bg-paper/25'"
            aria-hidden="true"
          />
        </button>
      </li>
    </ol>
  </nav>
</template>
