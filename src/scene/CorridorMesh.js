import * as THREE from 'three'

function createDoorFrame(z, side) {
    const group = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.85 })
    const x = side === 'left' ? -1.85 : 1.85

    const postGeo = new THREE.BoxGeometry(0.12, 2.8, 0.08)
    const leftPost = new THREE.Mesh(postGeo, mat)
    leftPost.position.set(x, 1.4, z - 0.45)
    leftPost.castShadow = true
    leftPost.receiveShadow = true
    group.add(leftPost)

    const rightPost = new THREE.Mesh(postGeo, mat)
    rightPost.position.set(x, 1.4, z + 0.45)
    rightPost.castShadow = true
    rightPost.receiveShadow = true
    group.add(rightPost)

    const lintelGeo = new THREE.BoxGeometry(0.12, 0.1, 1.0)
    const lintel = new THREE.Mesh(lintelGeo, mat)
    lintel.position.set(x, 2.8, z)
    lintel.castShadow = true
    lintel.receiveShadow = true
    group.add(lintel)

    return group
}

function createPipe(startZ, endZ, y, x) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.6 })
    const length = Math.abs(endZ - startZ)
    const midZ = (startZ + endZ) / 2
    const group = new THREE.Group()

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length, 8), mat)
    pipe.rotation.x = Math.PI / 2
    pipe.position.set(x, y, midZ)
    pipe.castShadow = true
    pipe.receiveShadow = true
    group.add(pipe)

    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.7 })
    const bracketCount = Math.floor(length / 3)
    for (let i = 0; i <= bracketCount; i++) {
        const bz = startZ + (length / bracketCount) * i
        const bracket = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 8), bracketMat)
        bracket.position.set(x, y, bz)
        bracket.rotation.y = Math.PI / 2
        bracket.castShadow = true
        group.add(bracket)
    }

    return group
}

function createDebris() {
    const group = new THREE.Group()

    // Fallen planks — larger and brighter so they're visible
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.85 })

    const plank1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.15), plankMat)
    plank1.position.set(-0.6, 0.025, 5)
    plank1.rotation.y = 0.35
    plank1.receiveShadow = true
    plank1.castShadow = true
    group.add(plank1)

    const plank2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.12), plankMat)
    plank2.position.set(0.4, 0.025, -1)
    plank2.rotation.y = -0.6
    plank2.receiveShadow = true
    plank2.castShadow = true
    group.add(plank2)

    const plank3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.14), plankMat)
    plank3.position.set(-0.2, 0.025, -10)
    plank3.rotation.y = 1.2
    plank3.receiveShadow = true
    plank3.castShadow = true
    group.add(plank3)

    // Rubble — bigger pieces, brighter material
    const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x7a6b55, roughness: 0.95 })
    const rubbleData = [
        { pos: [-1.2, 0.08, 3], size: 0.12 },
        { pos: [0.7, 0.06, -4], size: 0.10 },
        { pos: [-0.5, 0.10, -8], size: 0.14 },
        { pos: [1.1, 0.06, 7], size: 0.10 },
        { pos: [-0.9, 0.08, -2], size: 0.12 },
        { pos: [0.3, 0.07, 10], size: 0.11 },
        { pos: [-1.0, 0.09, -5], size: 0.13 },
        { pos: [0.8, 0.06, 0], size: 0.09 },
    ]
    for (const { pos, size } of rubbleData) {
        const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rubbleMat)
        rubble.position.set(pos[0], pos[1], pos[2])
        rubble.rotation.set(pos[2] * 0.7, pos[0] * 1.3, 0)
        rubble.castShadow = true
        rubble.receiveShadow = true
        group.add(rubble)
    }

    // Overturned bucket — bigger
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.4 })
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 8, 1, true), bucketMat)
    bucket.position.set(1.0, 0.12, -6)
    bucket.rotation.x = Math.PI / 2 + 0.3
    bucket.rotation.z = 0.5
    bucket.castShadow = true
    bucket.receiveShadow = true
    group.add(bucket)

    // Broken crate
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 0.9 })
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), crateMat)
    crate.position.set(-1.3, 0.175, -11)
    crate.rotation.y = 0.2
    crate.castShadow = true
    crate.receiveShadow = true
    group.add(crate)

    // Bottle on its side
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x446644, roughness: 0.3, metalness: 0.1 })
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8), bottleMat)
    bottle.position.set(0.9, 0.035, 3)
    bottle.rotation.z = Math.PI / 2
    bottle.rotation.y = 0.8
    bottle.castShadow = true
    group.add(bottle)

    return group
}

export function createCorridor() {
    const group = new THREE.Group()

    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x6b5540,
        roughness: 0.9,
    })

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), wallMat.clone())
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    group.add(floor)

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), wallMat.clone())
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 3.2
    ceiling.receiveShadow = true
    group.add(ceiling)

    // Walls — thick enough to be solid and opaque
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 30), wallMat)
    leftWall.position.set(-2.15, 1.6, 0)
    leftWall.receiveShadow = true
    leftWall.castShadow = true
    group.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 30), wallMat)
    rightWall.position.set(2.15, 1.6, 0)
    rightWall.receiveShadow = true
    rightWall.castShadow = true
    group.add(rightWall)

    // End wall (far end)
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.2, 0.3), wallMat)
    endWall.position.set(0, 1.6, -15.15)
    endWall.receiveShadow = true
    group.add(endWall)

    // Start wall (behind player)
    const startWall = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.2, 0.3), wallMat)
    startWall.position.set(0, 1.6, 15.15)
    startWall.receiveShadow = true
    group.add(startWall)

    // Window quad
    const windowMat = new THREE.MeshBasicMaterial({
        color: 0xfff4cc,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
    })
    const windowQuad = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), windowMat)
    windowQuad.position.set(1.98, 2.0, 2)
    windowQuad.rotation.y = -Math.PI / 2
    windowQuad.userData.isLightSource = true
    group.add(windowQuad)

    // Window bars
    const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    for (let i = 0; i < 4; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.05), barMat)
        bar.position.set(1.93, 2.0, 2 + (i - 1.5) * 0.3)
        bar.castShadow = true
        group.add(bar)
    }

    // Far-end bulb (existing)
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 })
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08), bulbMat)
    bulb.position.set(0, 3.0, -12)
    group.add(bulb)

    // Spawn-area bulb (near player start at z=8)
    const spawnBulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 })
    const spawnBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08), spawnBulbMat)
    spawnBulb.position.set(0, 3.0, 8)
    group.add(spawnBulb)

    // === PROPS ===
    group.add(createDoorFrame(-3, 'left'))
    group.add(createDoorFrame(-9, 'left'))
    group.add(createDoorFrame(-6, 'right'))
    group.add(createPipe(-14, 10, 3.05, -1.8))
    group.add(createPipe(-10, 5, 3.1, 1.75))
    group.add(createDebris())

    return group
}
