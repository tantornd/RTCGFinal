// === PORTED FROM FOUNDATION: glsl-godrays 3-pass structure ===
// Original: gl-fbo for occlusion RT, colorProgram for B&W mask, alpha-blend composite
// Ported to Three.js: WebGLRenderTarget, material swap, ShaderPass composite
import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import godRayBlurFrag from '../shaders/godRayBlur.frag.glsl'

const fullscreenVert = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const compositeFragShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tGodRays;
varying vec2 vUv;
void main() {
    vec4 scene = texture2D(tDiffuse, vUv);
    vec4 rays = texture2D(tGodRays, vUv);
    gl_FragColor = scene + rays * 0.65;
}
`

export function createGodRaySystem(renderer, scene, camera, windowLight) {
    const halfW = Math.floor(window.innerWidth / 2)
    const halfH = Math.floor(window.innerHeight / 2)

    const occlusionRT = new THREE.WebGLRenderTarget(halfW, halfH, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
    })

    const godRayRT = new THREE.WebGLRenderTarget(halfW, halfH, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
    })

    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff })

    // God ray blur pass renders into godRayRT
    const godRayBlurScene = new THREE.Scene()
    const godRayBlurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const godRayBlurMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tOcclusion: { value: occlusionRT.texture },
            uLightPos: { value: new THREE.Vector2(0.5, 0.5) },
            uExposure: { value: 0.3 },
            uDecay: { value: 0.97 },
            uDensity: { value: 0.8 },
            uWeight: { value: 0.4 },
        },
        vertexShader: fullscreenVert,
        fragmentShader: godRayBlurFrag,
    })
    const godRayBlurQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        godRayBlurMaterial
    )
    godRayBlurScene.add(godRayBlurQuad)

    const compositePass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            tGodRays: { value: null },
        },
        vertexShader: fullscreenVert,
        fragmentShader: compositeFragShader,
    })
    compositePass.uniforms.tGodRays.value = godRayRT.texture

    function renderOcclusion() {
        const originalOverrideMaterial = scene.overrideMaterial
        const originalBackground = scene.background

        scene.traverse((obj) => {
            if (obj.isMesh) {
                obj._originalMaterial = obj.material
                if (obj.userData.isLightSource) {
                    obj.material = whiteMat
                } else {
                    obj.material = blackMat
                }
            }
        })
        scene.background = new THREE.Color(0x000000)

        renderer.setRenderTarget(occlusionRT)
        renderer.render(scene, camera)
        renderer.setRenderTarget(null)

        scene.traverse((obj) => {
            if (obj.isMesh && obj._originalMaterial) {
                obj.material = obj._originalMaterial
                delete obj._originalMaterial
            }
        })
        scene.background = originalBackground
    }

    function renderGodRays() {
        renderer.setRenderTarget(godRayRT)
        renderer.render(godRayBlurScene, godRayBlurCamera)
        renderer.setRenderTarget(null)
    }

    function update() {
        const lsp = windowLight.position.clone().project(camera)
        godRayBlurMaterial.uniforms.uLightPos.value.set(
            Math.max(0, Math.min(1, (lsp.x + 1) / 2)),
            Math.max(0, Math.min(1, (lsp.y + 1) / 2))
        )

        renderOcclusion()
        renderGodRays()
    }

    function resize() {
        const hw = Math.floor(window.innerWidth / 2)
        const hh = Math.floor(window.innerHeight / 2)
        occlusionRT.setSize(hw, hh)
        godRayRT.setSize(hw, hh)
    }

    return { compositePass, update, resize }
}
