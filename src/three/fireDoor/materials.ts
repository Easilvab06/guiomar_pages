import {
  AdditiveBlending,
  Color,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Texture,
} from 'three'
import type { FireDoorQuality } from '@/types/fireDoor'
import {
  createConcreteTextures,
  createFloorTextures,
  createGlowTexture,
  createPaintTextures,
  createWireGlassTexture,
} from './textures'

/**
 * Biblioteca única de materiales de la experiencia. Todas las mallas
 * referencian estas instancias (ninguna malla crea su propio material),
 * lo que reduce cambios de estado en GPU y simplifica la liberación.
 */
export interface FireDoorMaterials {
  readonly concrete: MeshStandardMaterial
  readonly concreteDark: MeshStandardMaterial
  readonly floor: MeshStandardMaterial
  readonly doorPaint: MeshPhysicalMaterial
  readonly frameSteel: MeshPhysicalMaterial
  readonly brushedSteel: MeshPhysicalMaterial
  readonly seal: MeshStandardMaterial
  readonly glass: MeshPhysicalMaterial
  readonly lightStrip: MeshBasicMaterial
  readonly warmStrip: MeshBasicMaterial
  readonly warmRoom: MeshBasicMaterial
  readonly exitSign: MeshBasicMaterial
  readonly alarmRed: MeshStandardMaterial
  readonly skylight: MeshBasicMaterial
  readonly floorSpill: MeshBasicMaterial
  dispose(): void
}

export function createFireDoorMaterials(quality: FireDoorQuality, maxAnisotropy: number): FireDoorMaterials {
  const size = quality === 'high' ? 512 : 256
  const concreteTex = createConcreteTextures(size)
  const floorTex = createFloorTextures(size)
  const paintTex = createPaintTextures(quality === 'high' ? 256 : 128)
  const glowTex = createGlowTexture(64)
  const wireTex = createWireGlassTexture(128)

  const textures: Texture[] = [
    concreteTex.map,
    concreteTex.roughnessMap,
    concreteTex.normalMap,
    floorTex.map,
    floorTex.roughnessMap,
    floorTex.normalMap,
    paintTex.roughnessMap,
    paintTex.normalMap,
    glowTex,
    wireTex,
  ]
  const anisotropy = Math.min(quality === 'high' ? 8 : 2, maxAnisotropy)
  for (const texture of textures) texture.anisotropy = anisotropy

  // Pintura: la textura de "piel de naranja" se repite muy fino sobre la hoja
  paintTex.normalMap.repeat.set(8, 16)
  paintTex.roughnessMap.repeat.set(1, 2)
  wireTex.repeat.set(1, 3)

  const concrete = new MeshStandardMaterial({
    color: new Color('#b9b6b1'),
    map: concreteTex.map,
    roughnessMap: concreteTex.roughnessMap,
    normalMap: concreteTex.normalMap,
    normalScale: new Vector2(0.3, 0.3),
    roughness: 1,
    metalness: 0,
  })

  const concreteDark = new MeshStandardMaterial({
    color: new Color('#8a8784'),
    map: concreteTex.map,
    roughnessMap: concreteTex.roughnessMap,
    normalMap: concreteTex.normalMap,
    normalScale: new Vector2(0.25, 0.25),
    roughness: 1,
    metalness: 0,
  })

  const floor = new MeshStandardMaterial({
    color: new Color('#9a9894'),
    map: floorTex.map,
    roughnessMap: floorTex.roughnessMap,
    normalMap: floorTex.normalMap,
    normalScale: new Vector2(0.15, 0.15),
    roughness: 0.75,
    metalness: 0,
    envMapIntensity: 1.4,
  })

  const doorPaint = new MeshPhysicalMaterial({
    color: new Color('#3b3e43'),
    metalness: 0.3,
    roughness: 0.62,
    roughnessMap: paintTex.roughnessMap,
    normalMap: paintTex.normalMap,
    normalScale: new Vector2(0.06, 0.06),
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
  })

  const frameSteel = new MeshPhysicalMaterial({
    color: new Color('#2d2f34'),
    metalness: 0.55,
    roughness: 0.45,
    roughnessMap: paintTex.roughnessMap,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
  })

  const brushedSteel = new MeshPhysicalMaterial({
    color: new Color('#c8cbd0'),
    metalness: 1,
    roughness: 0.3,
    anisotropy: quality === 'high' ? 0.65 : 0,
    envMapIntensity: 1.2,
  })

  const seal = new MeshStandardMaterial({ color: new Color('#101012'), roughness: 0.92, metalness: 0 })

  const glass = new MeshPhysicalMaterial({
    color: new Color('#ffffff'),
    map: wireTex,
    metalness: 0.1,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  })

  const lightStrip = new MeshBasicMaterial({ color: new Color('#fff6ea') })
  const warmStrip = new MeshBasicMaterial({ color: new Color('#ffd7a3') })
  const warmRoom = new MeshBasicMaterial({ color: new Color('#ffb36b') })
  const exitSign = new MeshBasicMaterial({ color: new Color('#2bdc72') })
  const skylight = new MeshBasicMaterial({ color: new Color('#f3f6ff') })

  const alarmRed = new MeshStandardMaterial({ color: new Color('#c2111b'), roughness: 0.38, metalness: 0.1 })

  const floorSpill = new MeshBasicMaterial({
    color: new Color('#ffb26a'),
    map: glowTex,
    transparent: true,
    opacity: 0.55,
    blending: AdditiveBlending,
    depthWrite: false,
  })

  const materials = [
    concrete,
    concreteDark,
    floor,
    doorPaint,
    frameSteel,
    brushedSteel,
    seal,
    glass,
    lightStrip,
    warmStrip,
    warmRoom,
    exitSign,
    alarmRed,
    skylight,
    floorSpill,
  ]

  return {
    concrete,
    concreteDark,
    floor,
    doorPaint,
    frameSteel,
    brushedSteel,
    seal,
    glass,
    lightStrip,
    warmStrip,
    warmRoom,
    exitSign,
    alarmRed,
    skylight,
    floorSpill,
    dispose() {
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
    },
  }
}
