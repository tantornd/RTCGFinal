import * as THREE from 'three'

export function SceneSetup() {
  const canvas = document.getElementById('canvas')

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 2.5

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 80)
  camera.position.set(0, 1.6, 8)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  return { renderer, camera, scene }
}
