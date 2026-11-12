<script setup lang="ts">
import { provideSmoothScroll } from '@/utils/smoothScroll'
import MagneticCursor from '@/components/MagneticCursor.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import HeroSection from '@/components/HeroSection.vue'
import BrandMarquee from '@/components/BrandMarquee.vue'
import ShowcaseSection from '@/components/ShowcaseSection.vue'
import FireDoorsSection from '@/components/FireDoorsSection.vue'
import BrochureGallery from '@/components/BrochureGallery.vue'
import AboutSection from '@/components/AboutSection.vue'
import ContactSection from '@/components/ContactSection.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import BrochureLightbox from '@/components/BrochureLightbox.vue'

/**
 * Proveedor raíz del scroll suave. Debe crearse antes de que los hijos
 * monten: sus `onMounted` (que crean ScrollTriggers) se ejecutan antes que
 * el del padre, pero Lenis solo intercepta la rueda/touch y ScrollTrigger
 * lee la posición nativa, así que el orden es seguro. Al desmontar App se
 * destruye Lenis y se ejecuta `ScrollTrigger.killAll()` como red de seguridad.
 */
provideSmoothScroll({
  lenis: { lerp: 0.085, wheelMultiplier: 0.95 },
  respectReducedMotion: true,
})
</script>

<template>
  <a
    href="#contenido"
    class="fixed top-3 left-3 z-[110] -translate-y-24 rounded-full bg-paper px-5 py-3 text-fluid-sm font-bold text-ink-950 focus:translate-y-0"
  >
    Saltar al contenido
  </a>

  <MagneticCursor />
  <SiteHeader />

  <main id="contenido">
    <HeroSection />
    <BrandMarquee />
    <ShowcaseSection />
    <FireDoorsSection />
    <BrochureGallery />
    <AboutSection />
    <ContactSection />
  </main>

  <SiteFooter />
  <BrochureLightbox />
</template>
