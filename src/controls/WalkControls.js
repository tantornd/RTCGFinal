import * as THREE from 'three'

export function createWalkControls(camera, canvas) {
    const speed = 2.5
    const keys = {}
    let yaw = 0
    let pitch = 0
    let locked = false

    const MIN_X = -1.7
    const MAX_X = 1.7
    const MIN_Z = -14.5
    const MAX_Z = 14.5

    const euler = new THREE.Euler(0, 0, 0, 'YXZ')
    const direction = new THREE.Vector3()

    // Flashlight — SpotLight attached to camera
    const flashlight = new THREE.SpotLight(0xffeedd, 3.0)
    flashlight.angle = Math.PI / 8
    flashlight.penumbra = 0.4
    flashlight.decay = 1.5
    flashlight.distance = 18
    flashlight.castShadow = true
    flashlight.shadow.mapSize.set(512, 512)
    flashlight.shadow.bias = -0.003
    flashlight.visible = false

    const flashTarget = new THREE.Object3D()
    camera.add(flashlight)
    camera.add(flashTarget)
    flashlight.position.set(0.3, -0.2, 0)
    flashTarget.position.set(0, 0, -5)
    flashlight.target = flashTarget

    let flashlightOn = false

    canvas.addEventListener('click', () => {
        canvas.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => {
        locked = document.pointerLockElement === canvas
    })

    document.addEventListener('mousemove', (e) => {
        if (!locked) return
        yaw -= e.movementX * 0.002
        pitch -= e.movementY * 0.002
        pitch = Math.max(-Math.PI * 80 / 180, Math.min(Math.PI * 80 / 180, pitch))
    })

    document.addEventListener('keydown', (e) => {
        keys[e.code] = true
        if (e.code === 'KeyF') {
            flashlightOn = !flashlightOn
            flashlight.visible = flashlightOn
        }
    })
    document.addEventListener('keyup', (e) => { keys[e.code] = false })

    function update(delta) {
        euler.set(pitch, yaw, 0)
        camera.quaternion.setFromEuler(euler)

        direction.set(0, 0, 0)
        if (keys['KeyW']) direction.z -= 1
        if (keys['KeyS']) direction.z += 1
        if (keys['KeyA']) direction.x -= 1
        if (keys['KeyD']) direction.x += 1

        if (direction.lengthSq() > 0) {
            direction.normalize()
            direction.applyQuaternion(camera.quaternion)
            direction.y = 0
            direction.normalize()
            camera.position.addScaledVector(direction, speed * delta)
        }

        camera.position.x = Math.max(MIN_X, Math.min(MAX_X, camera.position.x))
        camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z))
        camera.position.y = 1.6
    }

    return { update, flashlight }
}
