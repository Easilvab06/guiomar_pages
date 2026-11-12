import {
  Color,
  FogExp2,
  MathUtils,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DOOR_PHASE_END } from '@/data/fireDoorExperience'
import type { FireDoorQuality } from '@/types/fireDoor'
import { CameraRig } from './cameraRig'
import { buildLabyrinth, type Labyrinth } from './labyrinth'
import { createFireDoorMaterials, type FireDoorMaterials } from './materials'
import { clamp01, MonotoneCurve, smoothstep } from './motion'

/**
 * Apertura de la puerta en función del progreso de su fase (0..1).
 * Hitos del guion: 0–20 % cerrada (el pestillo cede al final), 40 % apertura
 * intermedia, 60 % ≈ 60°, 75 % = 90°, 100 % la cámara cruza el umbral con la
 * hoja apoyada a ~98°. La interpolación monótona da inercia de una hoja
 * pesada: arranque lento, aceleración en el tramo medio y frenado suave.
 */
const DOOR_ANGLE_CURVE = new MonotoneCurve([
  [0, 0],
  [0.2, 0],
  [0.24, 2],
  [0.4, 24],
  [0.6, 60],
  [0.75, 90],
  [1, 98],
])

export interface FireDoorWorld {
  readonly scene: Scene
  readonly camera: PerspectiveCamera
  /** Aplica el progreso global (0..1) a puerta, cámara, luces y laberinto */
  update(progress: number): void
  resize(width: number, height: number): void
  dispose(): void
}

export function doorAngleForProgress(progress: number): number {
  const phase = clamp01(progress / DOOR_PHASE_END)
  return MathUtils.degToRad(DOOR_ANGLE_CURVE.evaluate(phase))
}

export function createFireDoorWorld(renderer: WebGLRenderer, quality: FireDoorQuality): FireDoorWorld {
  const scene = new Scene()
  scene.background = new Color('#060607')
  scene.fog = new FogExp2('#060607', quality === 'high' ? 0.05 : 0.06)

  // Entorno PBR neutro para reflejos sutiles en metal y pintura
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const environment: Texture = pmrem.fromScene(room, 0.04).texture
  room.dispose()
  pmrem.dispose()
  scene.environment = environment
  scene.environmentIntensity = 0.22

  const camera = new PerspectiveCamera(38, 1, 0.05, 80)
  const materials: FireDoorMaterials = createFireDoorMaterials(quality, renderer.capabilities.getMaxAnisotropy())
  const labyrinth: Labyrinth = buildLabyrinth(materials, quality)
  scene.add(labyrinth.group)

  const rig = new CameraRig(quality)
  const position = new Vector3()
  const look = new Vector3()
  let portrait = false

  const update = (progress: number): void => {
    const p = clamp01(progress)
    labyrinth.setHeroDoorAngle(doorAngleForProgress(p))

    rig.evaluate(p, position, look)
    camera.position.copy(position)
    camera.lookAt(look)

    // Ligero cambio de perspectiva durante la apertura (de retrato a gran angular)
    const baseFov = portrait ? 52 : 38
    const fov = baseFov + smoothstep(0.08, 0.32, p) * (portrait ? 6 : 12)
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    labyrinth.update(p, position.z)

    // El vestíbulo se oscurece a medida que la luz interior toma protagonismo
    renderer.toneMappingExposure = 1.05 + smoothstep(0.85, 1, p) * 0.25
  }

  const resize = (width: number, height: number): void => {
    camera.aspect = width / Math.max(height, 1)
    portrait = camera.aspect < 0.9
    camera.updateProjectionMatrix()
  }

  return {
    scene,
    camera,
    update,
    resize,
    dispose() {
      scene.environment = null
      environment.dispose()
      labyrinth.dispose()
      materials.dispose()
      scene.clear()
    },
  }
}
