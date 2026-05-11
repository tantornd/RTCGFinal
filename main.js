import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SceneSetup } from './src/scene/SceneSetup.js'
import { createCorridor } from './src/scene/CorridorMesh.js'
import { createLights } from './src/scene/Lights.js'
import { createVolumetricPass } from './src/passes/VolumetricPass.js'
import { createGodRaySystem } from './src/passes/GodRayPass.js'
import { createWalkControls } from './src/controls/WalkControls.js'

const { renderer, camera, scene } = SceneSetup()

scene.add(camera)
scene.add(createCorridor())
const { windowLight, bulbLight, spawnBulbLight } = createLights(scene)

const controls = createWalkControls(camera, renderer.domElement)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const volumetricPass = createVolumetricPass(camera, windowLight)
composer.addPass(volumetricPass)

const godRays = createGodRaySystem(renderer, scene, camera, windowLight)
composer.addPass(godRays.compositePass)

let volumetricEnabled = true
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyV') {
        volumetricEnabled = !volumetricEnabled
        volumetricPass.enabled = volumetricEnabled
        godRays.compositePass.enabled = volumetricEnabled
    }
})

const timer = new THREE.Timer()

function animate(timestamp) {
    requestAnimationFrame(animate)
    timer.update(timestamp)
    const delta = timer.getDelta()
    const elapsed = timer.getElapsed()

    controls.update(delta)

    // Flicker: inharmonic sines for irregular pulsing
    const flicker1 = Math.sin(elapsed * 23.7) * Math.sin(elapsed * 7.3)
    bulbLight.intensity = 2.0 * (0.5 + 0.5 * flicker1)

    // Spawn bulb: different frequency for distinct rhythm
    const flicker2 = Math.sin(elapsed * 19.1) * Math.sin(elapsed * 11.3)
    spawnBulbLight.intensity = 2.0 * (0.5 + 0.5 * flicker2)

    volumetricPass.update(elapsed)
    godRays.update()

    composer.render()
}
requestAnimationFrame(animate)

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
    volumetricPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
    godRays.resize()
})
