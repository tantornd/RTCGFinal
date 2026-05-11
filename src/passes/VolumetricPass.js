import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import volumetricFrag from '../shaders/volumetric.frag.glsl'

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export function createVolumetricPass(camera, light) {
    const shader = {
        uniforms: {
            tDiffuse: { value: null },
            uTime: { value: 0.0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uLightPos: { value: new THREE.Vector3(3.5, 2.0, 2.0) },
            uFogFalloff: { value: 1.8 },
            uInvProjection: { value: new THREE.Matrix4() },
            uInvView: { value: new THREE.Matrix4() },
            uShadowMap: { value: null },
            uLightSpaceMatrix: { value: new THREE.Matrix4() },
        },
        vertexShader,
        fragmentShader: volumetricFrag,
    }

    const pass = new ShaderPass(shader)

    pass.update = function (elapsed) {
        this.uniforms.uTime.value = elapsed
        camera.updateMatrixWorld(true)
        this.uniforms.uInvProjection.value.copy(camera.projectionMatrixInverse)
        this.uniforms.uInvView.value.copy(camera.matrixWorld)

        if (light && light.shadow && light.shadow.map) {
            this.uniforms.uShadowMap.value = light.shadow.map.texture
            const shadowCamera = light.shadow.camera
            const lightSpaceMatrix = new THREE.Matrix4()
            lightSpaceMatrix.multiplyMatrices(shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse)
            this.uniforms.uLightSpaceMatrix.value.copy(lightSpaceMatrix)
        }
    }

    return pass
}
