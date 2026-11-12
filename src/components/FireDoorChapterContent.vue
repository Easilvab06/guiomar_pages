<script setup lang="ts">
import { ArrowUpRight, ClipboardCheck, Mail, Phone } from '@lucide/vue'
import BaseButton from '@/components/BaseButton.vue'
import FireDoorDetails from '@/components/FireDoorDetails.vue'
import { FIRE_DOOR_USES } from '@/data/companies'
import { FIRE_DOOR_IMAGES, FIRE_DOOR_RATING_NOTE, FIRE_DOOR_RATINGS } from '@/data/fireDoorExperience'
import { CONTACT, whatsappLink } from '@/data/contact'
import type { FireDoorChapter } from '@/types/fireDoor'

interface Props {
  chapter: FireDoorChapter
  total: number
  detailIndex: number
  layout: 'hud' | 'static'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectDetail: [index: number]
}>()

const quoteHref = whatsappLink('Hola S&G, quiero cotizar puertas cortafuego para mi proyecto.')
const inspectionHref = whatsappLink('Hola S&G, quiero agendar una inspección de mis puertas cortafuego.')
const primaryPhone = CONTACT.phones[0]
const applicationImages = [FIRE_DOOR_IMAGES.installation, FIRE_DOOR_IMAGES.protectedBuilding] as const

const headingId = `fd-capitulo-${props.chapter.number}-titulo`
</script>

<template>
  <div class="grid items-end gap-6 text-paper lg:grid-cols-12 lg:gap-10">
    <header :class="chapter.panel === 'none' ? 'lg:col-span-8' : 'lg:col-span-5'">
      <p class="eyebrow flex items-center gap-3 text-brand-500">
        <span aria-hidden="true">{{ chapter.number }}</span>
        <span class="h-px w-8 bg-brand-500" aria-hidden="true" />
        <span class="text-paper/70">{{ chapter.label }}</span>
        <span class="sr-only">— capítulo {{ chapter.number }} de {{ total }}</span>
      </p>
      <h3 :id="headingId" class="display mt-4 text-fluid-3xl text-balance">
        {{ chapter.title }}
      </h3>
      <p class="mt-4 max-w-xl text-fluid-base leading-relaxed text-paper/80">
        {{ chapter.subtitle }}
      </p>
    </header>

    <div v-if="chapter.panel !== 'none'" class="lg:col-span-6 lg:col-start-7">
      <!-- 04 · Ingeniería: collage de herrajes -->
      <FireDoorDetails
        v-if="chapter.panel === 'details'"
        :active-index="detailIndex"
        :compact="layout === 'hud'"
        @select="emit('selectDetail', $event)"
      />

      <!-- 05 · Resistencia -->
      <div v-else-if="chapter.panel === 'ratings'">
        <ul class="grid grid-cols-3 border-y border-white/15">
          <li
            v-for="(rating, index) in FIRE_DOOR_RATINGS"
            :key="rating.minutes"
            class="flex flex-col gap-1 py-5"
            :class="index > 0 ? 'border-l border-white/15 pl-4 sm:pl-6' : 'pr-4'"
          >
            <span class="display text-fluid-4xl leading-none" :class="index === 2 ? 'text-brand-500' : 'text-paper'">
              {{ rating.minutes }}
            </span>
            <span class="eyebrow text-paper/60">min</span>
          </li>
        </ul>
        <p class="mt-4 max-w-md text-fluid-xs leading-relaxed text-paper/60">{{ FIRE_DOOR_RATING_NOTE }}</p>
      </div>

      <!-- 06 · Aplicaciones: fotografías 05 y 06 -->
      <div v-else-if="chapter.panel === 'applications'" class="flex flex-col gap-3 sm:gap-5">
        <div class="grid grid-cols-2 gap-3">
          <figure v-for="image in applicationImages" :key="image.src" class="overflow-hidden rounded-xl ring-1 ring-white/10">
            <img
              :src="image.srcSmall"
              :srcset="`${image.srcSmall} 768w, ${image.src} 1376w`"
              sizes="(min-width: 1024px) 20vw, 45vw"
              :width="image.width"
              :height="image.height"
              :alt="image.alt"
              loading="lazy"
              decoding="async"
              class="block aspect-[21/9] w-full object-cover sm:aspect-[16/9]"
            />
          </figure>
        </div>
        <ul class="grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-x-6 sm:gap-y-2" aria-label="Espacios donde se requieren puertas cortafuego">
          <li
            v-for="(use, index) in FIRE_DOOR_USES"
            :key="use"
            class="flex items-baseline gap-2 border-b border-white/10 pb-1 text-fluid-xs text-paper/85 sm:pb-2 sm:text-fluid-sm"
          >
            <span class="font-display text-[0.75rem] text-brand-500 tabular-nums" aria-hidden="true">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            {{ use }}
          </li>
        </ul>
      </div>

      <!-- 07 · Conversión -->
      <div v-else-if="chapter.panel === 'conversion'" class="flex flex-col gap-6">
        <div class="flex flex-wrap gap-3">
          <BaseButton :href="quoteHref" size="lg" :magnetic="0.25">
            Solicitar cotización
            <ArrowUpRight class="size-5" aria-hidden="true" />
          </BaseButton>
          <BaseButton :href="inspectionHref" variant="glass" size="lg" :magnetic="0.25">
            <ClipboardCheck class="size-5" aria-hidden="true" />
            Agendar inspección
          </BaseButton>
        </div>
        <div class="flex flex-col gap-2 text-fluid-sm text-paper/75 sm:flex-row sm:gap-6">
          <a v-if="primaryPhone" :href="`tel:${primaryPhone.e164}`" class="inline-flex min-h-11 items-center gap-2 hover:text-paper">
            <Phone class="size-4" aria-hidden="true" />
            {{ primaryPhone.display }}
          </a>
          <a :href="`mailto:${CONTACT.email}`" class="inline-flex min-h-11 items-center gap-2 break-all hover:text-paper">
            <Mail class="size-4" aria-hidden="true" />
            {{ CONTACT.email }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
