<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpRight, Mail, MessageCircle, Phone } from '@lucide/vue'
import { CONTACT, whatsappLink } from '@/data/contact'
import { useGsap } from '@/composables/useGsap'
import { splitReveal } from '@/composables/splitReveal'
import { gsap, MOTION_QUERY } from '@/utils/gsap'

const sectionRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const accentRef = ref<HTMLElement | null>(null)

const whatsappHref = whatsappLink('Hola, quiero hablar con un asesor del Grupo Empresarial Guiomar Gutiérrez Ardila.')

interface Channel {
  readonly label: string
  readonly value: string
  readonly href: string
  readonly icon: typeof Phone
  readonly external: boolean
}

const CHANNELS: readonly Channel[] = [
  { label: 'WhatsApp', value: CONTACT.phones[0]?.display ?? '', href: whatsappHref, icon: MessageCircle, external: true },
  ...CONTACT.phones.map((phone) => ({
    label: 'Llámanos',
    value: phone.display,
    href: `tel:${phone.e164}`,
    icon: Phone,
    external: false,
  })),
  { label: 'Escríbenos', value: CONTACT.email, href: `mailto:${CONTACT.email}`, icon: Mail, external: false },
]

useGsap(sectionRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    if (titleRef.value) splitReveal(titleRef.value, { mode: 'chars' })
    if (accentRef.value) splitReveal(accentRef.value, { mode: 'words', delay: 0.3 })

    gsap.from(scope.querySelectorAll('[data-contact-item]'), {
      autoAlpha: 0,
      y: 40,
      stagger: 0.08,
      scrollTrigger: { trigger: scope.querySelector('[data-contact-list]'), start: 'top 85%', once: true },
    })

    gsap.from(scope.querySelector('[data-contact-orb]'), {
      scale: 0.4,
      rotate: -40,
      autoAlpha: 0,
      duration: 1.6,
      ease: 'elastic.out(1, 0.6)',
      scrollTrigger: { trigger: scope, start: 'top 60%', once: true },
    })
  })
})
</script>

<template>
  <section
    id="contacto"
    ref="sectionRef"
    class="relative overflow-hidden bg-ink-950 pt-(--spacing-section) pb-16"
    aria-labelledby="contacto-title"
  >
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_60%_at_50%_100%,rgb(194_17_27/0.45),transparent_70%)]"
      aria-hidden="true"
    />
    <div class="container-wide relative">
      <div class="grid items-center gap-16 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <p class="eyebrow flex items-center gap-3 text-brand-500">
            <span class="h-px w-10 bg-brand-500" aria-hidden="true" />
            Hablemos de tu proyecto
          </p>
          <h2 id="contacto-title" class="mt-8">
            <span ref="titleRef" data-split class="display block text-fluid-5xl text-paper">Tu éxito,</span>
            <span ref="accentRef" data-split class="block font-serif text-fluid-3xl leading-none text-paper/70 italic">
              también es nuestro propósito.
            </span>
          </h2>
          <p class="mt-8 max-w-xl text-fluid-lg text-paper/70">
            Más que proveedores, somos tu aliado estratégico. Cuéntanos qué necesitas y te conectamos con la
            solución indicada dentro del grupo.
          </p>
        </div>

        <div class="flex justify-start lg:col-span-4 lg:justify-end">
          <a
            data-contact-orb
            :href="whatsappHref"
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic="0.4"
            class="group relative flex size-48 rounded-full sm:size-56"
            aria-label="Cotizar por WhatsApp"
          >
            <span
              data-magnetic-inner
              class="flex size-full flex-col items-center justify-center gap-2 rounded-full bg-brand-500 text-white shadow-[0_30px_80px_-20px_rgb(227_20_31/0.8)] transition-colors duration-300 group-hover:bg-brand-400"
            >
              <ArrowUpRight class="size-8 transition-transform duration-500 group-hover:rotate-45" aria-hidden="true" />
              <span class="display text-fluid-xl">Cotizar</span>
            </span>
          </a>
        </div>
      </div>

      <ul data-contact-list class="mt-20 grid gap-3 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4">
        <li v-for="channel in CHANNELS" :key="channel.href" data-contact-item>
          <a
            :href="channel.href"
            :target="channel.external ? '_blank' : undefined"
            :rel="channel.external ? 'noopener noreferrer' : undefined"
            class="glass group flex h-full flex-col gap-10 rounded-3xl p-6 transition-colors duration-500 hover:bg-white/10"
          >
            <span class="flex items-center justify-between">
              <component :is="channel.icon" class="size-6 text-brand-500" :stroke-width="1.75" aria-hidden="true" />
              <ArrowUpRight
                class="size-5 text-paper/40 transition-[color,rotate] duration-500 group-hover:rotate-45 group-hover:text-paper"
                aria-hidden="true"
              />
            </span>
            <span>
              <span class="eyebrow block text-paper/50">{{ channel.label }}</span>
              <span class="mt-2 block text-fluid-lg font-semibold break-all text-paper sm:break-normal">
                {{ channel.value }}
              </span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
