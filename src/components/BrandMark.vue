<script setup lang="ts">
interface Props {
  tone?: 'light' | 'dark'
  compact?: boolean
}

withDefaults(defineProps<Props>(), { tone: 'light', compact: false })
</script>

<template>
  <span class="inline-flex items-center gap-3" :class="tone === 'light' ? 'text-paper' : 'text-ink-950'">
    <svg viewBox="0 0 64 64" class="size-10 shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="16" :fill="tone === 'light' ? '#16161a' : '#0d0d0f'" />
      <path
        d="M44 18H26a8 8 0 0 0 0 16h12a8 8 0 0 1 0 16H20"
        fill="none"
        stroke="#e3141f"
        stroke-width="7"
        stroke-linecap="round"
      />
    </svg>
    <span v-if="!compact" class="flex flex-col leading-none">
      <span class="text-[0.95rem] font-extrabold tracking-tight">Guiomar Gutiérrez Ardila</span>
      <span class="mt-1 text-[0.625rem] font-bold tracking-[0.28em] text-brand-500 uppercase">Grupo Empresarial</span>
    </span>
  </span>
</template>
