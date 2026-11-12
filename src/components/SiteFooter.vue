<script setup lang="ts">
import BrandMark from '@/components/BrandMark.vue'
import { COMPANIES } from '@/data/companies'
import { CONTACT, NAV_LINKS } from '@/data/contact'
import { useSmoothScroll } from '@/utils/smoothScroll'

const smooth = useSmoothScroll()
const year = new Date().getFullYear()

function navigate(href: string): void {
  smooth.scrollTo(href, { offset: -16 })
}
</script>

<template>
  <footer class="relative border-t border-white/10 bg-ink-950 pt-16 pb-10">
    <div class="container-wide">
      <div class="grid gap-12 lg:grid-cols-12">
        <div class="lg:col-span-5">
          <BrandMark />
          <p class="mt-8 max-w-sm font-serif text-fluid-xl leading-tight text-paper/80 italic">
            {{ CONTACT.slogan }}.
          </p>
        </div>

        <nav class="lg:col-span-2" aria-label="Secciones">
          <p class="eyebrow text-paper/40">Secciones</p>
          <ul class="mt-5 grid gap-2.5">
            <li v-for="link in NAV_LINKS" :key="link.href">
              <a :href="link.href" class="text-fluid-sm text-paper/70 hover:text-paper" @click.prevent="navigate(link.href)">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>

        <div class="lg:col-span-3">
          <p class="eyebrow text-paper/40">Empresas</p>
          <ul class="mt-5 grid gap-2.5">
            <li v-for="company in COMPANIES" :key="company.id" class="text-fluid-sm text-paper/70">
              {{ company.name }}
              <span class="text-paper/35">· {{ company.category }}</span>
            </li>
          </ul>
        </div>

        <div class="lg:col-span-2">
          <p class="eyebrow text-paper/40">Contacto</p>
          <ul class="mt-5 grid gap-2.5 text-fluid-sm">
            <li v-for="phone in CONTACT.phones" :key="phone.e164">
              <a :href="`tel:${phone.e164}`" class="text-paper/70 hover:text-paper">{{ phone.display }}</a>
            </li>
            <li>
              <a :href="`mailto:${CONTACT.email}`" class="break-all text-paper/70 hover:text-paper">{{ CONTACT.email }}</a>
            </li>
          </ul>
        </div>
      </div>

      <p class="display mt-20 text-center text-[clamp(3rem,13vw,13rem)] leading-[0.8] text-white/[0.04] select-none" aria-hidden="true">
        Guiomar G. Ardila
      </p>

      <div class="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-fluid-xs text-paper/40 sm:flex-row">
        <p>© {{ year }} {{ CONTACT.brand }} · {{ CONTACT.group }}. Todos los derechos reservados.</p>
        <p>Construyendo juntos un mejor futuro.</p>
      </div>
    </div>
  </footer>
</template>
