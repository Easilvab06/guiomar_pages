<script setup lang="ts">
import { ref } from 'vue'
import { useFireDoorScene } from '@/composables/useFireDoorScene'
import { FIRE_DOOR_IMAGES } from '@/data/fireDoorExperience'
import type { FireDoorQuality } from '@/types/fireDoor'

interface Props {
  quality: FireDoorQuality
}

const props = defineProps<Props>()

const emit = defineEmits<{
  ready: []
  fallback: [reason: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const scene = useFireDoorScene(canvasRef, containerRef, {
  quality: props.quality,
  onReady: () => emit('ready'),
  onFallback: (reason) => emit('fallback', reason),
})

/** El bucle único de la experiencia llama a este método en cada frame */
defineExpose({ render: scene.render })

const poster = FIRE_DOOR_IMAGES.doorClosed
</script>

<template>
  <div ref="containerRef" class="absolute inset-0 overflow-hidden bg-ink-950" aria-hidden="true">
    <!-- Póster: la fotografía 01 cubre la construcción de la escena y luego se funde -->
    <img
      :src="poster.src"
      :srcset="`${poster.srcSmall} 768w, ${poster.src} 1376w`"
      sizes="100vw"
      :width="poster.width"
      :height="poster.height"
      alt=""
      decoding="async"
      class="absolute inset-0 size-full object-cover transition-opacity duration-1000"
      :class="scene.ready.value ? 'opacity-0' : 'opacity-100'"
    />
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full transition-opacity duration-1000"
      :class="scene.ready.value ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
