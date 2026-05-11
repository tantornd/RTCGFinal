// === PORTED FROM FOUNDATION: glsl-godrays by Erkaman ===
// https://github.com/Erkaman/glsl-godrays
// Original: godrays() function using glslify module pattern
// Ported to Three.js ShaderPass with uniforms instead of function parameters
// Reference: "Volumetric Light Scattering as a Post-Process" (GPU Gems 3, Ch.13)
uniform sampler2D tOcclusion;
uniform vec2 uLightPos;
uniform float uExposure;
uniform float uDecay;
uniform float uDensity;
uniform float uWeight;

varying vec2 vUv;

const int NUM_SAMPLES = 80;

void main() {
    vec2 uv = vUv;
    vec2 delta = (uv - uLightPos) / float(NUM_SAMPLES) * uDensity;
    float illumination = 1.0;
    vec4 color = vec4(0.0);
    for (int i = 0; i < NUM_SAMPLES; i++) {
        uv -= delta;
        vec4 s = texture2D(tOcclusion, clamp(uv, 0.0, 1.0));
        s *= illumination * uWeight;
        color += s;
        illumination *= uDecay;
    }
    gl_FragColor = color * uExposure;
}
