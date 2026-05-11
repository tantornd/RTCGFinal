uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uLightPos;
uniform float uFogFalloff;
uniform mat4 uInvProjection;
uniform mat4 uInvView;
uniform sampler2D tDiffuse;
uniform sampler2D uShadowMap;
uniform mat4 uLightSpaceMatrix;

varying vec2 vUv;

// === Simplex noise by Stefan Gustavson (public domain) ===
// https://github.com/stegu/webgl-noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// === MY EXTENSION: volumetric ray-marched fog ===
// The foundation (glsl-godrays) only provides screen-space radial blur.
// This entire shader is my addition — real volumetric fog via ray marching.

// Density gradient helper for directional lighting approximation
float map(in vec3 p) {
    return max(0.0, dot(p, vec3(0.0, 1.0, 0.0)) + 0.2);
}

// === MY EXTENSION: Henyey-Greenstein phase function (Addition #4) ===
// Standard HG phase function. Produces the forward-scatter peak characteristic of
// Mie scattering off water droplets. g in [0,1) controls forward bias.
// Reference: Henyey & Greenstein (1941), Astrophysical Journal 93, 70-83.
float henyeyGreenstein(float cosTheta, float g) {
    float g2 = g * g;
    float denom = pow(max(1.0 + g2 - 2.0 * g * cosTheta, 1e-4), 1.5);
    return (1.0 - g2) / (12.566370614 * denom); // 12.566 = 4 * pi
}

// === MY EXTENSION: Interleaved Gradient Noise (Addition #5) ===
// Jorge Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare"
// (SIGGRAPH 2014). Deterministic per-pixel hash; offsets the starting t of the ray
// march so neighbouring pixels sample at different depths. Trades visible banding
// for blue-noise-like dithering, allowing fewer march steps.
float interleavedGradientNoise(vec2 fragCoord) {
    return fract(52.9829189 * fract(0.06711056 * fragCoord.x + 0.00583715 * fragCoord.y));
}

// Front-to-back compositing — accumulates in-scatter only (additive)
vec4 integrate(in vec4 sum, in float dif, in float den, in vec3 bgcol, in float t) {
    vec3 lightColor = vec3(1.0, 0.85, 0.6) * dif;
    vec3 ambientFog = vec3(0.06, 0.065, 0.07);
    vec3 scatter = lightColor + ambientFog;
    float alpha = den * 0.35;
    scatter *= alpha;
    scatter *= exp(-0.01 * t * t);
    return sum + vec4(scatter, alpha) * (1.0 - sum.w);
}

void main() {
    vec2 p = (2.0 * vUv - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);

    vec4 clipPos = vec4(p, 1.0, 1.0);
    vec4 viewDir = uInvProjection * clipPos;
    viewDir = vec4(viewDir.xyz / viewDir.w, 0.0);
    vec3 rd = normalize((uInvView * viewDir).xyz);
    vec3 ro = (uInvView * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    vec3 lp = uLightPos - ro;
    vec3 bgcol = vec3(0.02, 0.02, 0.03);

    vec4 sum = vec4(0.0);
    // IGN jitter (Addition #5): offset starting t by up to one nominal step
    float ign = interleavedGradientNoise(gl_FragCoord.xy);
    float t = 0.05 + ign * 0.06;

    for (int i = 0; i < 70; i++) {
        if (sum.w > 0.99) break;
        vec3 pos = ro + t * rd;

        // Fog only exists inside the corridor volume
        if (pos.x < -2.0 || pos.x > 2.0 || pos.z < -15.0 || pos.z > 15.0 || pos.y < 0.0 || pos.y > 3.2) {
            t += max(0.06, 0.05 * t);
            continue;
        }

        // === MY EXTENSION: height-based density (Addition #1) ===
        float heightFactor = exp(-max(pos.y, 0.0) * uFogFalloff);
        float den = 0.45 * heightFactor;

        // === MY EXTENSION: 3D noise modulation (Addition #2) ===
        // Two octaves scaled for corridor width (~4 units)
        vec3 drift = vec3(uTime * 0.07, uTime * 0.04, uTime * 0.18);
        float n1 = snoise(pos * 0.6 + drift);
        float n2 = snoise(pos * 1.4 + drift * 2.0 + vec3(7.0, 3.0, 0.0));
        float noiseFactor = 0.45 + 0.35 * n1 + 0.2 * n2;
        den *= noiseFactor;
        den = clamp(den, 0.0, 0.5);

        if (den > 0.01) {
            float dif = clamp((den - map(pos + 0.3 * lp)) / 0.6, 0.0, 1.0);

            // === MY EXTENSION: HG phase applied to in-scattering term (Addition #4) ===
            // Forward-scatter peak: rays look brightest when the camera faces the source.
            vec3 lightDir = normalize(uLightPos - pos);
            float cosTheta = dot(-rd, lightDir);
            float phase = henyeyGreenstein(cosTheta, 0.6);
            dif = clamp(dif * phase * 4.0, 0.0, 1.2);

            // === MY EXTENSION: shadow map occlusion (Addition #3) ===
            vec4 lightSpacePos = uLightSpaceMatrix * vec4(pos, 1.0);
            lightSpacePos.xyz /= lightSpacePos.w;
            lightSpacePos.xyz = lightSpacePos.xyz * 0.5 + 0.5;
            if (lightSpacePos.x >= 0.0 && lightSpacePos.x <= 1.0 &&
                lightSpacePos.y >= 0.0 && lightSpacePos.y <= 1.0) {
                float shadowDepth = texture2D(uShadowMap, lightSpacePos.xy).r;
                float inShadow = step(lightSpacePos.z - 0.005, shadowDepth);
                dif *= inShadow;
            }

            sum = integrate(sum, dif, den, bgcol, t);
        }
        t += max(0.06, 0.05 * t);
    }

    vec4 sceneColor = texture2D(tDiffuse, vUv);
    // Additive: fog scattering adds light on top of scene, never obscures it
    vec3 col = sceneColor.rgb + sum.xyz;
    gl_FragColor = vec4(col, 1.0);
}
