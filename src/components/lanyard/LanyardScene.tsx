/* eslint-disable react-hooks/immutability -- Three.js objects and the projected DOM hit area are imperative animation targets, updated outside React rendering. */
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRapier, useRopeJoint, useSphericalJoint, type RapierRigidBody } from '@react-three/rapier'
import { MeshLineMaterial } from 'meshline'
import { Color, Group, Mesh, PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three'
import type { LanyardProps } from './Lanyard'
import type { TiltVector } from './deviceTilt'
import { useCardTexture, useStrapTexture } from './textures'
import { createRibbon } from './ribbon'

type SceneProps = Required<Pick<LanyardProps, 'frontImage' | 'strapImage' | 'cardColor' | 'strapColor' | 'clipColor' | 'gravity' | 'cameraDistance' | 'lightingIntensity' | 'startPosition' | 'interactive'>> & {
  backImage?: string
  visible: boolean
  reduced: boolean
  host: RefObject<HTMLDivElement | null>
  hit: RefObject<HTMLButtonElement | null>
  tiltVector: RefObject<TiltVector>
}
const bodyOptions = { colliders: false, canSleep: true, angularDamping: 4, linearDamping: 4 } as const
const outline = [[-.358, .023], [.358, .023], [.358, 1.023], [.069, 1.023], [.069, 1.23], [-.069, 1.23], [-.069, 1.023], [-.358, 1.023]]

function Band(props: SceneProps) {
  const { frontImage, backImage, cardColor, clipColor, strapImage, strapColor, interactive, reduced, visible, hit, host } = props
  const fixed = useRef<RapierRigidBody>(null!), j1 = useRef<RapierRigidBody>(null!), j2 = useRef<RapierRigidBody>(null!), j3 = useRef<RapierRigidBody>(null!), card = useRef<RapierRigidBody>(null!)
  const cardGroup = useRef<Group>(null), ring = useRef<Group>(null), joint1 = useRef<Group>(null), joint2 = useRef<Group>(null)
  const { camera, size, invalidate } = useThree()
  const { world } = useRapier()
  const smoothedTilt = useRef({ x: 0, y: 0 })
  const { nodes } = useGLTF('/assets/lanyard/card.glb')
  const texture = useCardTexture(frontImage, backImage, cardColor, invalidate)
  const strap = useStrapTexture(strapImage, invalidate)
  const [ribbon, material] = useMemo(() => [createRibbon(), new MeshLineMaterial({ resolution: new Vector2(1, 1), lineWidth: 1 })], [])
  const scratch = useMemo(() => ({ ray: new Raycaster(), ndc: new Vector2(), plane: new Plane(new Vector3(0, 0, 1), 0),
    target: new Vector3(), offset: new Vector3(), held: new Vector3(), step: new Vector3(), corner: new Vector3(), anchor: new Vector3() }), [])
  const drag = useRef({ active: false, id: -1 })
  const warmup = useRef(24)
  const bodies = useMemo(() => [j1, j2, j3, card], [])
  const [layout] = useState(() => {
    if (reduced || props.startPosition === 'top') return [[0, -1, 0], [0, -2, 0], [0, -3, 0], [0, -4.5, 0]] as [number, number, number][]
    const x = props.startPosition === 'left' ? -1 : props.startPosition === 'right' ? 1 : 0
    const y = props.startPosition === 'bottom' ? -2.2 : 0
    return [.5, 1, 1.5, 2].map(k => [x * k, y * k, 0] as [number, number, number])
  })
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]])

  useEffect(() => {
    material.depthTest = false
    material.map = strap!
    material.useMap = strap && strapImage ? 1 : 0
    material.color = new Color(strap && strapImage ? '#ffffff' : strapColor)
    const aspect = strap?.image ? (strap.image as HTMLImageElement).width / (strap.image as HTMLImageElement).height : 1
    material.repeat.set(-17 / aspect, 1)
    invalidate()
  }, [material, strap, strapImage, strapColor, invalidate])
  useEffect(() => { material.resolution.set(size.width, size.height) }, [material, size])
  useEffect(() => {
    camera.position.z = Math.max(props.cameraDistance, 7 / (size.width / size.height))
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, props.cameraDistance, size, invalidate])
  useEffect(() => () => { ribbon.geometry.dispose(); material.dispose() }, [ribbon, material])

  useEffect(() => {
    const button = hit.current, container = host.current
    if (!button || !container) return
    const wake = () => { bodies.forEach(body => body.current?.wakeUp()); warmup.current = 8; invalidate() }
    const reset = () => {
      drag.current.active = false
      card.current?.setBodyType(0, true)
      bodies.forEach((body, i) => {
        body.current?.setTranslation({ x: 0, y: [3, 2, 1, -.5][i], z: 0 }, true)
        body.current?.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
        body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.current?.setAngvel({ x: 0, y: 0, z: 0 }, true)
      })
      button.dataset.dragging = 'false'
      button.style.cursor = 'grab'
      wake()
    }
    const setPoint = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect()
      scratch.ndc.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
      scratch.ray.setFromCamera(scratch.ndc, camera)
      scratch.ray.ray.intersectPlane(scratch.plane, scratch.target)
    }
    const end = () => {
      if (!drag.current.active) return
      drag.current.active = false
      if (button.hasPointerCapture(drag.current.id)) button.releasePointerCapture(drag.current.id)
      card.current?.setBodyType(0, true)
      button.dataset.dragging = 'false'
      button.style.cursor = 'grab'
      wake()
    }
    const down = (event: PointerEvent) => {
      if (!interactive || !visible || !event.isPrimary || event.button !== 0 || !card.current || drag.current.active) return
      event.preventDefault()
      button.focus({ preventScroll: true })
      button.dataset.pointer = 'true'
      scratch.plane.constant = -card.current.translation().z
      setPoint(event)
      scratch.offset.copy(scratch.target).sub(card.current.translation())
      scratch.held.copy(card.current.translation())
      drag.current = { active: true, id: event.pointerId }
      button.setPointerCapture(event.pointerId)
      card.current.setBodyType(2, true)
      button.dataset.dragging = 'true'
      button.style.cursor = 'grabbing'
      wake()
    }
    const move = (event: PointerEvent) => {
      if (!drag.current.active || drag.current.id !== event.pointerId) return
      event.preventDefault(); setPoint(event); invalidate()
    }
    const key = (event: KeyboardEvent) => {
      if (!interactive || !visible || !card.current) return
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Home', 'Escape'].includes(event.key)) return
      event.preventDefault()
      button.dataset.pointer = 'false'
      if (event.key === 'Home' || event.key === 'Escape') { end(); reset(); return }
      if (event.key === ' ') card.current.applyTorqueImpulse({ x: 0, y: .22, z: 0 }, true)
      else card.current.applyImpulse({ x: event.key === 'ArrowLeft' ? -.35 : event.key === 'ArrowRight' ? .35 : 0,
        y: event.key === 'ArrowUp' ? .25 : event.key === 'ArrowDown' ? -.15 : 0, z: 0 }, true)
      wake()
    }
    button.addEventListener('pointerdown', down)
    button.addEventListener('pointermove', move)
    button.addEventListener('pointerup', end)
    button.addEventListener('pointercancel', end)
    button.addEventListener('lostpointercapture', end)
    button.addEventListener('keydown', key)
    const focus = () => { button.dataset.pointer = 'false' }
    button.addEventListener('focus', focus)
    container.addEventListener('lanyard-reset', reset)
    container.addEventListener('lanyard-tilt', wake)
    window.addEventListener('blur', end)
    if (visible) invalidate()
    return () => {
      end()
      button.style.visibility = 'hidden'
      button.removeEventListener('pointerdown', down); button.removeEventListener('pointermove', move)
      button.removeEventListener('pointerup', end); button.removeEventListener('pointercancel', end)
      button.removeEventListener('lostpointercapture', end); button.removeEventListener('keydown', key)
      button.removeEventListener('focus', focus)
      container.removeEventListener('lanyard-reset', reset); container.removeEventListener('lanyard-tilt', wake); window.removeEventListener('blur', end)
    }
  }, [interactive, visible, camera, hit, host, bodies, scratch, invalidate])

  useEffect(() => {
    if (reduced) host.current?.dispatchEvent(new Event('lanyard-reset'))
  }, [reduced, host])

  useFrame((state, delta) => {
    if (!visible || !card.current || !fixed.current || !j1.current || !j2.current || !j3.current || !ring.current || !joint1.current || !joint2.current || !cardGroup.current) return
    // Move gravity rather than repeatedly kicking the card: a steady phone can settle.
    // Dragging takes priority; resume smoothly toward the latest sample on release.
    const target = drag.current.active ? { x: 0, y: 0 } : props.tiltVector.current
    const tilt = smoothedTilt.current, ease = 1 - Math.exp(-Math.min(delta, .05) * 10)
    tilt.x += (target.x - tilt.x) * ease; tilt.y += (target.y - tilt.y) * ease
    const tilting = Math.abs(target.x - tilt.x) + Math.abs(target.y - tilt.y) > .0005
    if (!tilting) { tilt.x = target.x; tilt.y = target.y }
    const baseDistance = Math.max(props.cameraDistance, 7 / (size.width / size.height))
    const halfFov = Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360)
    const fittedDistance = (1.25 + Math.abs(tilt.x) * 6) / (halfFov * size.width / size.height) + Math.max(0, tilt.y) * 6
    const distance = tilt.x || tilt.y ? Math.max(baseDistance, fittedDistance) : baseDistance
    camera.position.z += (distance - camera.position.z) * ease
    const framing = Math.abs(distance - camera.position.z) > .01
    if (!framing) camera.position.z = distance
    camera.updateMatrixWorld()
    world.gravity = { x: tilt.x * props.gravity, y: -props.gravity, z: tilt.y * props.gravity }
    if (tilting) bodies.forEach(body => body.current?.wakeUp())
    if (host.current) { host.current.dataset.tiltX = tilt.x.toFixed(4); host.current.dataset.tiltY = tilt.y.toFixed(4); host.current.dataset.cameraDistance = camera.position.z.toFixed(3) }
    if (drag.current.active) {
      const dt = Math.min(delta, .05)
      scratch.step.copy(scratch.target).sub(scratch.offset)
      scratch.anchor.copy(fixed.current.translation())
      scratch.step.sub(scratch.anchor)
      // Prevent impossible reach and sharp folds while keeping a little slack.
      scratch.step.clampLength(3.4, 4.45).add(scratch.anchor)
      scratch.step.sub(scratch.held).multiplyScalar(1 - Math.exp(-dt * 38)).clampLength(0, 32 * dt)
      scratch.held.add(scratch.step)
      card.current.setNextKinematicTranslation(scratch.held)
      bodies.forEach(body => body.current?.wakeUp())
    }
    const angular = card.current.angvel(), rotation = card.current.rotation()
    if (!card.current.isSleeping()) card.current.setAngvel({ x: angular.x, y: angular.y - rotation.y * .25, z: angular.z }, false)
    ring.current.getWorldPosition(ribbon.curve.points[0])
    joint2.current.getWorldPosition(ribbon.curve.points[1])
    joint1.current.getWorldPosition(ribbon.curve.points[2])
    ribbon.curve.points[3].copy(fixed.current.translation())
    ribbon.update()
    const button = hit.current
    if (button) {
      cardGroup.current.updateWorldMatrix(true, false)
      const polygon = outline.map(([x, y]) => {
        scratch.corner.set(x, y, 0).applyMatrix4(cardGroup.current!.matrixWorld).project(camera)
        return `${((scratch.corner.x + 1) * size.width / 2).toFixed(1)}px ${((1 - scratch.corner.y) * size.height / 2).toFixed(1)}px`
      })
      button.style.clipPath = `polygon(${polygon.join(',')})`
      button.style.visibility = interactive ? 'visible' : 'hidden'
      button.dataset.ready = 'true'
    }
    const moving = drag.current.active || bodies.some(body => !body.current?.isSleeping())
    if (host.current) host.current.dataset.motion = moving ? 'moving' : 'resting'
    if (warmup.current-- > 0 || moving || tilting || framing) state.invalidate()
  })

  return <>
    <group position={[0, 4, 0]}>
      <RigidBody ref={fixed} type="fixed" {...bodyOptions} />
      <RigidBody ref={j1} position={layout[0]} {...bodyOptions}><BallCollider args={[.1]} /><group ref={joint1} /></RigidBody>
      <RigidBody ref={j2} position={layout[1]} {...bodyOptions}><BallCollider args={[.1]} /><group ref={joint2} /></RigidBody>
      <RigidBody ref={j3} position={layout[2]} {...bodyOptions}><BallCollider args={[.1]} /></RigidBody>
      <RigidBody ref={card} position={layout[3]} {...bodyOptions}>
        <CuboidCollider args={[.8, 1.125, .01]} />
        <group ref={ring} position={[0, 1.5, 0]} />
        <group ref={cardGroup} scale={2.25} position={[0, -1.2, -.05]}>
          <mesh geometry={(nodes.card as Mesh).geometry}>
            <meshPhysicalMaterial key={texture?.uuid ?? 'loading'} color={texture ? 'white' : cardColor} map={texture} clearcoat={1} clearcoatRoughness={.15} roughness={.9} metalness={.8} />
          </mesh>
          <mesh geometry={(nodes.clip as Mesh).geometry}><meshStandardMaterial color={clipColor} roughness={.3} metalness={.8} /></mesh>
          <mesh geometry={(nodes.clamp as Mesh).geometry}><meshStandardMaterial color={clipColor} roughness={.3} metalness={.8} /></mesh>
        </group>
      </RigidBody>
    </group>
    <mesh geometry={ribbon.geometry} material={material} frustumCulled={false} />
  </>
}

function Lighting({ intensity }: { intensity: number }) {
  const k = intensity / 50
  return <>
    <ambientLight intensity={Math.PI * k} />
    <Environment blur={.75} resolution={256}>
      <Lightformer intensity={2 * k} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, .1, 1]} />
      <Lightformer intensity={3 * k} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, .1, 1]} />
      <Lightformer intensity={3 * k} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, .1, 1]} />
      <Lightformer intensity={10 * k} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
    </Environment>
  </>
}

export default function LanyardScene(props: SceneProps) {
  return <Canvas frameloop={props.visible ? 'demand' : 'never'} dpr={[1, 1.5]} camera={{ position: [0, 0, props.cameraDistance], fov: 20 }}
    gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }} style={{ pointerEvents: 'none' }}>
    <Suspense fallback={null}>
      <Lighting intensity={props.lightingIntensity} />
      <Physics gravity={[0, -props.gravity, 0]} timeStep={1 / 60} paused={!props.visible}>
        <Band {...props} />
      </Physics>
    </Suspense>
  </Canvas>
}
