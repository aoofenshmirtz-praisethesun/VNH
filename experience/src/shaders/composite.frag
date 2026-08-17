precision highp float;

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D uNormals;
uniform sampler2D uNoiseTex;
uniform sampler2D tHighlight;
uniform vec2  uResolution;
uniform float uTime;
uniform float uInkStrength;   // 0.85 default (3b.2: was 1.0 — caused saturation)
uniform float uWobble;        // 1.0 default
uniform float uFillMix;       // 0.35 default; 0.0 = pure monochrome reference look

const vec3 PARCHMENT = vec3(0.9922, 0.9882, 0.9608);  // #fdfcf5
const vec3 INK       = vec3(0.1333, 0.1255, 0.1098);  // #22201c
const vec3 EXCEED    = vec3(0.6980, 0.2275, 0.1490);  // #b23a26

float sobelMag(sampler2D tex, vec2 uv, vec2 texel) {
  vec3 tl = texture2D(tex, uv + texel * vec2(-1.,-1.)).rgb;
  vec3 tc = texture2D(tex, uv + texel * vec2( 0.,-1.)).rgb;
  vec3 tr = texture2D(tex, uv + texel * vec2( 1.,-1.)).rgb;
  vec3 ml = texture2D(tex, uv + texel * vec2(-1., 0.)).rgb;
  vec3 mr = texture2D(tex, uv + texel * vec2( 1., 0.)).rgb;
  vec3 bl = texture2D(tex, uv + texel * vec2(-1., 1.)).rgb;
  vec3 bc = texture2D(tex, uv + texel * vec2( 0., 1.)).rgb;
  vec3 br = texture2D(tex, uv + texel * vec2( 1., 1.)).rgb;
  vec3 gx = -tl - 2.*ml - bl + tr + 2.*mr + br;
  vec3 gy = -tl - 2.*tc - tr + bl + 2.*bc + br;
  return sqrt(dot(gx,gx) + dot(gy,gy));
}

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), u.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);
}

// 3b.3: Paper grain anchored in PIXELS, not UV. Resolution-independent, cannot alias.
float paperTone(vec2 fragPx){
  vec2 p = fragPx / 3.2;                        // ~3 device px per noise cell, at any resolution
  float f = vnoise(p)*0.5 + vnoise(p*2.6)*0.3 + vnoise(p*0.09)*0.2;
  return 0.93 + f*0.07;
}

void main() {
  vec2 texel = 1.0 / uResolution;

  // ---- the hand-drawn line. OFFSET the sample UV; never multiply the edge by noise.
  // Two octaves: a long slow wander + a short jitter. Both centred on zero (-0.5).
  vec2 n1 = texture2D(uNoiseTex, vUv *  3.0).rg - 0.5;
  vec2 n2 = texture2D(uNoiseTex, vUv * 11.0).gb - 0.5;
  vec2 uvN = vUv + (n1 * 0.0020 + n2 * 0.0009) * uWobble;

  float sD = sobelMag(tDiffuse, uvN, texel);
  float sN = sobelMag(uNormals, uvN, texel);

  // 3b.2: 0.25 normalises the 8-tap Sobel sum. Without it, every edge saturates to 100% black.
  float edge = (sD * 0.6 + sN * 0.3) * 0.25 * uInkStrength;
  edge = smoothstep(0.05, 0.70, edge);

  // 3b.3: paper grain in pixel space (was UV space — caused aliasing/banding)
  float paper = paperTone(gl_FragCoord.xy);

  // ---- compose
  vec3 scene = texture2D(tDiffuse, vUv).rgb;
  vec3 col   = mix(PARCHMENT, scene, uFillMix);   // lets lake/water fills survive faintly
  col = mix(col, INK, edge);

  vec2 hl = texture2D(tHighlight, vUv).rg;
  col = mix(col, EXCEED, hl.g * 0.45);    // exceedance — survives the ink
  col = mix(col, EXCEED, hl.r * 0.70);    // hover — stronger, added in 5.6

  col *= paper;
  col *= 1.0 - smoothstep(0.25, 0.85, length(vUv - 0.5)) * 0.35;   // vignette

  gl_FragColor = vec4(col, 1.0);
}
