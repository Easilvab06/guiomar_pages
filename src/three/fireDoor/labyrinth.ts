import {
  BufferGeometry,
  Group,
  HemisphereLight,
  Mesh,
  PlaneGeometry,
  PointLight,
  SpotLight,
  type Material,
  type Matrix4,
  type Object3D,
} from 'three'
import type { FireDoorQuality } from '@/types/fireDoor'
import { buildFireDoor, DoorGeometryCache, WALL_THICKNESS, type FireDoorAssembly } from './doorAssembly'
import { GeometryBatch, wallAlongX, wallAlongZ, worldBox, type Opening } from './geometry'
import type { FireDoorMaterials } from './materials'
import { smoothstep } from './motion'

/**
 * Arquitectura del recorrido (metros, −z = hacia el fondo):
 *
 *   Vestíbulo (z > 0) ── PUERTA PRINCIPAL (z = 0)
 *        │
 *   Corredor A (x ∈ [−1.3, 1.3], z 0 → −16.9)
 *        ├─ compartimentos laterales con puertas (algunas entreabiertas con luz cálida)
 *        ├─ tabique con puerta doble (z = −7) que se abre al aproximarse la cámara
 *        └─ giro a la derecha (z ≈ −15.6)
 *   Corredor B (z ∈ [−16.9, −14.3], x −1.3 → 12)
 *        └─ desemboca en el Atrio (x 12 → 26), doble altura con lucernario
 */

export const CORRIDOR_HEIGHT = 3.2
const HALF_WIDTH = 1.3
const T = WALL_THICKNESS
const A_END = -16.9
const B_NEAR = -14.3
const B_END_X = 12
const ATRIUM = { x0: 12, x1: 26, z0: -26, z1: -5, height: 8 } as const
const PARTITION_Z = -7
/** Vano exacto que ocupa una puerta estándar con su marco (ver doorAssembly) */
const DOOR_OPENING = { width: 1.212, height: 2.242 } as const

export interface Labyrinth {
  readonly group: Group
  readonly heroDoor: FireDoorAssembly
  /** Ángulo de la puerta principal (radianes) */
  setHeroDoorAngle(radians: number): void
  /** Actualiza luces y puerta doble según la posición de cámara y el progreso global */
  update(progress: number, cameraZ: number): void
  dispose(): void
}

interface SideDoor {
  readonly position: readonly [number, number, number]
  readonly rotationY: number
  readonly ajar: boolean
}

export function buildLabyrinth(materials: FireDoorMaterials, quality: FireDoorQuality): Labyrinth {
  const high = quality === 'high'
  const group = new Group()
  group.name = 'FireLabyrinth'
  const cache = new DoorGeometryCache()
  const ownedGeometries: BufferGeometry[] = []

  const walls = new GeometryBatch()
  const darkWalls = new GeometryBatch()
  const ceilings = new GeometryBatch()
  const strips = new GeometryBatch()
  const warmStrips = new GeometryBatch()
  const steel = new GeometryBatch()
  const exitSigns = new GeometryBatch()
  const alarms = new GeometryBatch()
  const warmRooms = new GeometryBatch()
  const skylights = new GeometryBatch()

  const halfOpening = DOOR_OPENING.width / 2

  // ------------------------------------------------------------ Piso único
  const floorGeometry = new PlaneGeometry(60, 50, 1, 1)
  floorGeometry.rotateX(-Math.PI / 2)
  floorGeometry.translate(8, 0, -10)
  const floorUv = floorGeometry.getAttribute('uv')
  const floorPos = floorGeometry.getAttribute('position')
  for (let i = 0; i < floorPos.count; i++) floorUv.setXY(i, floorPos.getX(i) / 2.4, floorPos.getZ(i) / 2.4)
  ownedGeometries.push(floorGeometry)
  const floor = new Mesh(floorGeometry, materials.floor)
  floor.name = 'Floor'
  floor.receiveShadow = high
  floor.matrixAutoUpdate = false
  group.add(floor)

  // ------------------------------------------------------- Vestíbulo exterior
  wallAlongX(walls, -T, T, -9, 9, 6, [{ from: -halfOpening, to: halfOpening, top: DOOR_OPENING.height }])
  wallAlongZ(darkWalls, -9, T, -T, 9, 6)
  wallAlongZ(darkWalls, 9, T, -T, 9, 6)
  ceilings.box({ x0: -9, x1: 9, y0: 6, y1: 6.2, z0: -T, z1: 9 })

  // ----------------------------------------------------------- Corredor A
  const leftDoors: Opening[] = [
    { from: -2.4, to: -2.4 - DOOR_OPENING.width, top: DOOR_OPENING.height },
    { from: -10.2, to: -10.2 - DOOR_OPENING.width, top: DOOR_OPENING.height },
  ]
  const rightDoors: Opening[] = [
    { from: -4.4, to: -4.4 - DOOR_OPENING.width, top: DOOR_OPENING.height },
    { from: -11.6, to: -11.6 - DOOR_OPENING.width, top: DOOR_OPENING.height },
  ]
  wallAlongZ(walls, -HALF_WIDTH - T, T, -T, A_END - T, CORRIDOR_HEIGHT, leftDoors)
  wallAlongZ(walls, HALF_WIDTH, T, -T, B_NEAR, CORRIDOR_HEIGHT, rightDoors)
  ceilings.box({ x0: -HALF_WIDTH - T, x1: HALF_WIDTH + T, y0: CORRIDOR_HEIGHT, y1: CORRIDOR_HEIGHT + 0.2, z0: A_END - T, z1: -T })

  // Tabique con puerta doble
  const partitionHalf = 0.9
  wallAlongX(walls, PARTITION_Z - T, T, -HALF_WIDTH, HALF_WIDTH, CORRIDOR_HEIGHT, [
    { from: -partitionHalf - 0.11, to: partitionHalf + 0.11, top: 2.4 },
  ])

  // ----------------------------------------------------------- Corredor B
  const nearDoors: Opening[] = [
    { from: 3.6, to: 3.6 + DOOR_OPENING.width, top: DOOR_OPENING.height },
    { from: 8.0, to: 8.0 + DOOR_OPENING.width, top: DOOR_OPENING.height },
  ]
  const farDoors: Opening[] = [{ from: 5.6, to: 5.6 + DOOR_OPENING.width, top: DOOR_OPENING.height }]
  wallAlongX(walls, B_NEAR, T, HALF_WIDTH, B_END_X, CORRIDOR_HEIGHT, nearDoors)
  wallAlongX(walls, A_END - T, T, -HALF_WIDTH - T, B_END_X, CORRIDOR_HEIGHT, farDoors)
  ceilings.box({ x0: HALF_WIDTH, x1: B_END_X, y0: CORRIDOR_HEIGHT, y1: CORRIDOR_HEIGHT + 0.2, z0: A_END - T, z1: B_NEAR + T })

  // ---------------------------------------------------------------- Atrio
  wallAlongZ(darkWalls, ATRIUM.x0 - T, T, ATRIUM.z0, ATRIUM.z1, ATRIUM.height, [
    { from: A_END, to: B_NEAR, top: CORRIDOR_HEIGHT },
  ])
  wallAlongZ(walls, ATRIUM.x1, T, ATRIUM.z0, ATRIUM.z1, ATRIUM.height, [
    { from: -16.6, to: -14.6, top: 2.6 },
  ])
  wallAlongX(darkWalls, ATRIUM.z1, T, ATRIUM.x0 - T, ATRIUM.x1 + T, ATRIUM.height)
  wallAlongX(darkWalls, ATRIUM.z0 - T, T, ATRIUM.x0 - T, ATRIUM.x1 + T, ATRIUM.height)

  // Losa con lucernario lineal (franjas de cielo entre vigas)
  const roofY = ATRIUM.height
  for (let x = ATRIUM.x0; x < ATRIUM.x1; x += 3.5) {
    ceilings.box({ x0: x, x1: x + 2.3, y0: roofY, y1: roofY + 0.3, z0: ATRIUM.z0, z1: ATRIUM.z1 })
    skylights.box({ x0: x + 2.3, x1: x + 3.5, y0: roofY + 0.28, y1: roofY + 0.3, z0: ATRIUM.z0, z1: ATRIUM.z1 })
  }
  // Columnas y vigas brutalistas
  for (const cx of [16, 20.5]) {
    for (const cz of [-9.5, -21.5]) {
      walls.box({ x0: cx - 0.35, x1: cx + 0.35, y0: 0, y1: roofY, z0: cz - 0.35, z1: cz + 0.35 })
    }
    darkWalls.box({ x0: cx - 0.3, x1: cx + 0.3, y0: roofY - 0.7, y1: roofY, z0: ATRIUM.z0, z1: ATRIUM.z1 })
  }
  // Pasarela de mezzanine sobre el fondo del atrio
  walls.box({ x0: 22.5, x1: ATRIUM.x1, y0: 3.6, y1: 3.9, z0: ATRIUM.z0, z1: ATRIUM.z1 })
  steel.box({ x0: 22.5, x1: 22.56, y0: 3.9, y1: 4.95, z0: ATRIUM.z0, z1: ATRIUM.z1 })
  warmStrips.box({ x0: 22.45, x1: 22.5, y0: 3.6, y1: 3.64, z0: ATRIUM.z0, z1: ATRIUM.z1 })

  // ------------------------------------------------- Iluminación lineal
  // Corredor A: luminarias transversales empotradas + bañadores al pie del muro
  for (let z = -1.6; z > A_END + 0.4; z -= 2.2) {
    strips.box({ x0: -0.85, x1: 0.85, y0: CORRIDOR_HEIGHT - 0.02, y1: CORRIDOR_HEIGHT, z0: z - 0.03, z1: z + 0.03 })
  }
  for (let x = HALF_WIDTH + 1.6; x < B_END_X - 0.4; x += 2.2) {
    strips.box({ x0: x - 0.03, x1: x + 0.03, y0: CORRIDOR_HEIGHT - 0.02, y1: CORRIDOR_HEIGHT, z0: A_END + 0.45, z1: B_NEAR - 0.45 })
  }
  // Rasantes cálidos (cove) en la unión muro-techo del lado izquierdo y zócalo luminoso
  warmStrips.box({ x0: -HALF_WIDTH, x1: -HALF_WIDTH + 0.04, y0: CORRIDOR_HEIGHT - 0.06, y1: CORRIDOR_HEIGHT, z0: A_END, z1: -T })
  warmStrips.box({ x0: HALF_WIDTH, x1: B_END_X, y0: CORRIDOR_HEIGHT - 0.06, y1: CORRIDOR_HEIGHT, z0: B_NEAR - 0.04, z1: B_NEAR })
  for (const [z0, z1] of [
    [-T, -2.4],
    [-2.4 - DOOR_OPENING.width, -10.2],
    [-10.2 - DOOR_OPENING.width, A_END],
  ] as const) {
    warmStrips.box({ x0: -HALF_WIDTH, x1: -HALF_WIDTH + 0.03, y0: 0.05, y1: 0.08, z0: Math.min(z0, z1), z1: Math.max(z0, z1) })
  }

  // --------------------------------------------- Puertas de compartimentos
  const sideDoors: SideDoor[] = [
    { position: [-HALF_WIDTH, 0, -2.4 - halfOpening], rotationY: Math.PI / 2, ajar: true },
    { position: [-HALF_WIDTH, 0, -10.2 - halfOpening], rotationY: Math.PI / 2, ajar: false },
    { position: [HALF_WIDTH, 0, -4.4 - halfOpening], rotationY: -Math.PI / 2, ajar: false },
    { position: [HALF_WIDTH, 0, -11.6 - halfOpening], rotationY: -Math.PI / 2, ajar: true },
    { position: [3.6 + halfOpening, 0, B_NEAR], rotationY: Math.PI, ajar: high },
    { position: [8.0 + halfOpening, 0, B_NEAR], rotationY: Math.PI, ajar: false },
    { position: [5.6 + halfOpening, 0, A_END], rotationY: 0, ajar: true },
  ]

  const standardSpec = {
    leafWidth: 0.98,
    leafHeight: 2.12,
    thickness: 0.055,
    visionPanel: true,
    closer: high,
    panicBar: true,
    frame: true,
    hero: false,
  } as const

  const roomDepth = 1.6
  for (const door of sideDoors) {
    const holder = new Group()
    holder.position.set(door.position[0], door.position[1], door.position[2])
    holder.rotation.y = door.rotationY
    group.add(holder)

    const assembly = buildFireDoor(materials, cache, standardSpec)
    holder.add(assembly.root)
    assembly.setAngle(door.ajar ? 0.62 : 0)

    // Señal de salida sobre el vano y estación de alarma junto a la puerta
    const exit = worldBox({ x0: -0.14, x1: 0.14, y0: 2.42, y1: 2.54, z0: 0, z1: 0.05 })
    exit.applyMatrix4(holderMatrix(holder))
    exitSigns.add(exit)
    const alarm = worldBox({ x0: 0.78, x1: 0.9, y0: 1.25, y1: 1.4, z0: 0, z1: 0.06 })
    alarm.applyMatrix4(holderMatrix(holder))
    alarms.add(alarm)

    if (door.ajar) {
      // Compartimento iluminado: fondo cálido y derrame de luz sobre el piso del corredor
      const room = worldBox({ x0: -0.9, x1: 0.9, y0: 0, y1: 2.6, z0: -T - roomDepth - 0.02, z1: -T - roomDepth })
      room.applyMatrix4(holderMatrix(holder))
      warmRooms.add(room)
      const sideA = worldBox({ x0: -0.92, x1: -0.9, y0: 0, y1: 2.6, z0: -T - roomDepth, z1: -T })
      const sideB = worldBox({ x0: 0.9, x1: 0.92, y0: 0, y1: 2.6, z0: -T - roomDepth, z1: -T })
      const roomCeil = worldBox({ x0: -0.92, x1: 0.92, y0: 2.6, y1: 2.62, z0: -T - roomDepth, z1: -T })
      for (const g of [sideA, sideB, roomCeil]) {
        g.applyMatrix4(holderMatrix(holder))
        darkWalls.add(g)
      }

      const spillGeometry = new PlaneGeometry(1.8, 1.6)
      spillGeometry.rotateX(-Math.PI / 2)
      ownedGeometries.push(spillGeometry)
      const spill = new Mesh(spillGeometry, materials.floorSpill)
      spill.position.set(0.25, 0.004, 0.6)
      spill.renderOrder = 2
      holder.add(spill)
    } else {
      const back = worldBox({ x0: -0.9, x1: 0.9, y0: 0, y1: 2.6, z0: -T - 0.12, z1: -T - 0.1 })
      back.applyMatrix4(holderMatrix(holder))
      darkWalls.add(back)
    }
  }

  // Puerta doble del tabique (sin cierrapuertas para no cruzar la trayectoria)
  const doubleSpec = { ...standardSpec, leafWidth: 0.88, closer: false, frame: false, visionPanel: true } as const
  const leftLeaf = buildFireDoor(materials, cache, doubleSpec)
  const rightLeaf = buildFireDoor(materials, cache, doubleSpec)
  leftLeaf.root.position.set(-partitionHalf + 0.44 + 0.006, 0, PARTITION_Z)
  rightLeaf.root.position.set(partitionHalf - 0.44 - 0.006, 0, PARTITION_Z)
  rightLeaf.root.scale.x = -1
  group.add(leftLeaf.root, rightLeaf.root)
  // Marco del vano doble
  steel.box({ x0: -partitionHalf - 0.11, x1: -partitionHalf, y0: 0, y1: 2.4, z0: PARTITION_Z - T, z1: PARTITION_Z + 0.03 })
  steel.box({ x0: partitionHalf, x1: partitionHalf + 0.11, y0: 0, y1: 2.4, z0: PARTITION_Z - T, z1: PARTITION_Z + 0.03 })
  steel.box({ x0: -partitionHalf - 0.11, x1: partitionHalf + 0.11, y0: 2.2, y1: 2.4, z0: PARTITION_Z - T, z1: PARTITION_Z + 0.03 })
  exitSigns.box({ x0: -0.16, x1: 0.16, y0: 2.5, y1: 2.64, z0: PARTITION_Z, z1: PARTITION_Z + 0.05 })

  // Puerta doble monumental al fondo del atrio (composición final)
  const finalSpec = { ...standardSpec, leafWidth: 0.98, closer: true, frame: false, visionPanel: true, hero: high } as const
  const finalLeft = buildFireDoor(materials, cache, finalSpec)
  const finalRight = buildFireDoor(materials, cache, finalSpec)
  for (const [leaf, side] of [
    [finalLeft, -1],
    [finalRight, 1],
  ] as const) {
    leaf.root.rotation.y = -Math.PI / 2
    leaf.root.position.set(ATRIUM.x1, 0, -15.6 + side * 0.5)
    if (side === 1) leaf.root.scale.x = -1
    group.add(leaf.root)
  }
  steel.box({ x0: ATRIUM.x1 - 0.03, x1: ATRIUM.x1 + T, y0: 2.4, y1: 2.6, z0: -16.6, z1: -14.6 })
  steel.box({ x0: ATRIUM.x1 - 0.03, x1: ATRIUM.x1 + T, y0: 0, y1: 2.6, z0: -16.7, z1: -16.6 })
  steel.box({ x0: ATRIUM.x1 - 0.03, x1: ATRIUM.x1 + T, y0: 0, y1: 2.6, z0: -14.6, z1: -14.5 })
  warmRooms.box({ x0: ATRIUM.x1 + T + 1.2, x1: ATRIUM.x1 + T + 1.22, y0: 0, y1: 2.6, z0: -16.6, z1: -14.6 })

  // ------------------------------------------------------------ Mallas fusionadas
  const batches: readonly (readonly [GeometryBatch, Material, boolean])[] = [
    [walls, materials.concrete, high],
    [darkWalls, materials.concreteDark, high],
    [ceilings, materials.concreteDark, false],
    [strips, materials.lightStrip, false],
    [warmStrips, materials.warmStrip, false],
    [steel, materials.frameSteel, false],
    [exitSigns, materials.exitSign, false],
    [alarms, materials.alarmRed, false],
    [warmRooms, materials.warmRoom, false],
    [skylights, materials.skylight, false],
  ]
  for (const [batch, material, receiveShadow] of batches) {
    const mesh = batch.toMesh(material, { receiveShadow })
    if (!mesh) continue
    ownedGeometries.push(mesh.geometry)
    group.add(mesh)
  }

  // ------------------------------------------------------- Puerta principal
  const heroDoor = buildFireDoor(materials, cache, {
    leafWidth: 0.98,
    leafHeight: 2.12,
    thickness: 0.055,
    visionPanel: true,
    closer: true,
    panicBar: true,
    frame: true,
    hero: true,
  })
  heroDoor.root.traverse((object: Object3D) => {
    if (object instanceof Mesh) {
      object.castShadow = high
      object.receiveShadow = high
    }
  })
  group.add(heroDoor.root)

  // ---------------------------------------------------------------- Luces
  const hemi = new HemisphereLight('#c9d2e0', '#1a1714', 0.35)
  group.add(hemi)

  // Cenital rasante sobre la puerta (como en las fotografías de referencia)
  // Alcance limitado: no debe colarse por el vano hasta el tabique interior
  const key = new SpotLight('#fff1df', 140, 8.5, 0.55, 0.75, 2)
  key.position.set(0.9, 5.4, 3.2)
  key.target.position.set(0, 1.1, 0)
  key.castShadow = high
  if (high) {
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    key.shadow.camera.near = 1
    key.shadow.camera.far = 14
  }
  group.add(key, key.target)

  // Luz cálida del interior: aparece a medida que la hoja se abre
  const interior = new PointLight('#ffe0bd', 0, 5, 2)
  interior.position.set(0.1, 2.5, -2.4)
  group.add(interior)

  const corridorLights: PointLight[] = []
  const corridorPoints: readonly (readonly [number, number, number])[] = high
    ? [
        [0, 2.95, -3.8],
        [0, 2.95, -11.5],
        [3.5, 2.95, -15.6],
        [9, 2.95, -15.6],
      ]
    : [
        [0, 2.95, -7],
        [5, 2.95, -15.6],
      ]
  for (const [x, y, z] of corridorPoints) {
    const light = new PointLight('#fff0dc', high ? 5 : 8, 10, 2)
    light.position.set(x, y, z)
    corridorLights.push(light)
    group.add(light)
  }

  const atriumLight = new PointLight('#fff1e0', 60, 30, 2)
  atriumLight.position.set(19, 6.5, -15.6)
  group.add(atriumLight)
  // Bañador sobre el muro de la doble puerta final: la composición se ilumina al llegar
  const wallWash = new SpotLight('#fff3e6', 0, 22, 0.62, 0.8, 2)
  wallWash.position.set(17, 7.4, -15.6)
  wallWash.target.position.set(ATRIUM.x1, 2.2, -15.6)
  group.add(wallWash, wallWash.target)
  const finalGlow = new PointLight('#ffb36b', 0, 8, 2)
  finalGlow.position.set(ATRIUM.x1 - 1.4, 2.3, -15.6)
  group.add(finalGlow)

  const setHeroDoorAngle = (radians: number): void => {
    heroDoor.setAngle(radians)
    // La luz interior se revela con la apertura (0 → ~60°)
    interior.intensity = 6 * smoothstep(0.05, 1.05, radians)
  }

  const update = (progress: number, cameraZ: number): void => {
    // La puerta doble se abre cuando la cámara se aproxima al tabique (reversible)
    const angle = smoothstep(-2.6, -5.6, cameraZ) * 1.48
    leftLeaf.setAngle(angle)
    rightLeaf.setAngle(angle)

    // Composición final: el atrio se ilumina en el último capítulo
    const finale = smoothstep(0.78, 1, progress)
    atriumLight.intensity = 60 + finale * 140
    wallWash.intensity = finale * 950
    finalGlow.intensity = finale * 34
    finalLeft.setAngle(finale * 0.62)
    finalRight.setAngle(finale * 0.62)
  }

  return {
    group,
    heroDoor,
    setHeroDoorAngle,
    update,
    dispose() {
      cache.dispose()
      for (const geometry of ownedGeometries) geometry.dispose()
      ownedGeometries.length = 0
      key.shadow.dispose()
      key.dispose()
      interior.dispose()
      atriumLight.dispose()
      wallWash.dispose()
      finalGlow.dispose()
      hemi.dispose()
      for (const light of corridorLights) light.dispose()
    },
  }
}

/** Matriz local del contenedor (posición + rotación Y) para hornear geometría en mundo */
function holderMatrix(holder: Group): Matrix4 {
  holder.updateMatrix()
  return holder.matrix
}
