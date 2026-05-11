import * as THREE from 'three'

export function createLights(scene) {
    const windowLight = new THREE.SpotLight(0xfff4e0, 8.0)
    windowLight.position.set(3.5, 2.0, 2.0)
    windowLight.target.position.set(-1, 0, 1)
    windowLight.angle = Math.PI / 6
    windowLight.penumbra = 0.3
    windowLight.decay = 1.5
    windowLight.distance = 25
    windowLight.castShadow = true
    windowLight.shadow.mapSize.set(1024, 1024)
    windowLight.shadow.bias = -0.002
    scene.add(windowLight)
    scene.add(windowLight.target)

    // Far-end bulb light
    const bulbLight = new THREE.PointLight(0xff9933, 2.0, 15, 2)
    bulbLight.position.set(0, 2.9, -12)
    scene.add(bulbLight)

    // Spawn-area bulb light (near player start)
    const spawnBulbLight = new THREE.PointLight(0xff9933, 2.0, 15, 2)
    spawnBulbLight.position.set(0, 2.9, 8)
    scene.add(spawnBulbLight)

    const ambient = new THREE.AmbientLight(0x8090aa, 1.0)
    scene.add(ambient)

    const fillLight1 = new THREE.PointLight(0x334466, 2.0, 35, 2)
    fillLight1.position.set(0, 2.5, -5)
    scene.add(fillLight1)

    const fillLight2 = new THREE.PointLight(0x334466, 1.5, 35, 2)
    fillLight2.position.set(0, 2.5, 8)
    scene.add(fillLight2)

    return { windowLight, bulbLight, spawnBulbLight, ambient }
}
