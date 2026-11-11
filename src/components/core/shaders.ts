/** GLSL for the Living Core. One vertex shader (noise deformation), several fragment looks. */

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
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
`;

export const VERTEX = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uDeform;
uniform float uFreq;
uniform float uRidge;
uniform float uElastic;
uniform float uRadius;
uniform float uPhase;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
varying float vD;

float field(vec3 p){
  vec3 q = p * uFreq + vec3(uPhase);
  float t = uTime;
  float n1 = snoise(q + vec3(0.0, t*0.30, t*0.18));
  float n2 = snoise(q*2.2 - vec3(t*0.26, 0.0, t*0.22));
  float smoothF = n1*0.72 + n2*0.28;
  float r = 1.0 - abs(snoise(q*1.2 + vec3(t*0.2, -t*0.15, 0.0)));
  float ridgeF = r*r*1.5 - 0.7 + n2*0.15;
  return mix(smoothF, ridgeF, uRidge);
}
vec3 displace(vec3 p){
  float d = field(p) * uDeform;
  d += uElastic * 0.05 * sin(uTime*2.6 + p.y*4.0 + p.x*2.0);
  return p * (uRadius + d);
}
void main(){
  vec3 p = normalize(position);
  vec3 up = abs(p.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tn = normalize(cross(up, p));
  vec3 bn = normalize(cross(p, tn));
  float e = 0.03;
  vec3 p0 = displace(p);
  vec3 p1 = displace(normalize(p + tn*e));
  vec3 p2 = displace(normalize(p + bn*e));
  vec3 n = normalize(cross(p1 - p0, p2 - p0));
  vN = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vV = normalize(-mv.xyz);
  vObj = p0;
  vD = length(p0) - uRadius;
  gl_Position = projectionMatrix * mv;
}
`;

/** Translucent membrane: fresnel + flowing veins + optional structural contours. */
export const SHELL_FRAGMENT = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uFreq;
uniform float uVein;
uniform float uVeinSharp;
uniform float uFlow;
uniform float uFresnel;
uniform float uGloss;
uniform float uSpec;
uniform float uBands;
uniform float uStruct;
uniform float uIrid;
uniform float uAlpha;
uniform float uLayer;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColHot;
uniform vec3 uColRim;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
varying float vD;

void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = abs(dot(n, v));
  float f = pow(1.0 - ndv, uFresnel);
  float t = uTime;
  vec3 q = vObj * uFreq * 1.1;
  float g = snoise(q*0.9 + vec3(t*0.08)) * 0.5 + 0.5;
  vec3 base = mix(uColA, uColB, smoothstep(0.15, 0.85, g + vObj.y*0.12 + vD*0.8));

  vec3 w = q + vec3(snoise(q*1.4 + t*0.12), snoise(q*1.4 + 7.3 - t*0.10), snoise(q*1.4 + 13.1 + t*0.08)) * 0.55;
  float v1 = 1.0 - abs(snoise(w*0.8 + vec3(0.0, t*0.18*uFlow, 0.0)));
  float v2 = 1.0 - abs(snoise(w*1.6 - vec3(t*0.22*uFlow, 0.0, 0.0)));
  float veins = (pow(v1, 5.0*uVeinSharp) + 0.55*pow(v2, 9.0*uVeinSharp)) * uVein;

  float s = vObj.y*uBands + g*3.0;
  float c = abs(fract(s) - 0.5);
  float lines = smoothstep(0.46, 0.5, c) * uStruct;

  vec3 L = normalize(vec3(-0.45, 0.6, 0.7));
  vec3 h = normalize(L + v);
  float spec = pow(max(dot(n, h), 0.0), uGloss) * uSpec;
  float diff = max(dot(n, L), 0.0);
  vec3 shimmer = 0.5 + 0.5*cos(6.2831*(f*1.1 + vec3(0.0, 0.33, 0.67) + t*0.03));

  vec3 col = base * (0.45 + 0.6*diff + f*1.0);
  col += uColRim * f * 0.6;
  col += mix(base, shimmer, 0.5) * f * 0.14 * uIrid;
  col += uColHot * veins * 0.8;
  col += uColRim * lines * (0.45 + f);
  col += uColRim * spec * 0.35;

  float a = (0.10 + f*0.78 + veins*0.55 + lines*0.4 + spec*0.35) * uAlpha * uLayer;
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}
`;

/** Dark glossy body: gives depth and, for Venom / Batman Beyond, material weight. */
export const BODY_FRAGMENT = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uColRim;
uniform float uBodyAlpha;
uniform float uGloss;
uniform float uSpec;
uniform float uFresnel;
varying vec3 vN;
varying vec3 vV;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = max(dot(n, v), 0.0);
  float f = pow(1.0 - ndv, uFresnel);
  vec3 L = normalize(vec3(-0.45, 0.6, 0.7));
  vec3 h = normalize(L + v);
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, h), 0.0), uGloss) * uSpec;
  vec3 col = (uBody * (0.55 + 0.9*diff)) + uColRim * f * 0.18 + vec3(1.0) * spec * 0.55;
  gl_FragColor = vec4(col, uBodyAlpha * (0.55 + 0.45*(1.0 - f)));
}
`;

/** Internal energy: flowing plasma inside the membrane. */
export const INNER_FRAGMENT = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uFreq;
uniform float uFlow;
uniform float uAlpha;
uniform vec3 uColA;
uniform vec3 uColHot;
uniform vec3 uColRim;
varying vec3 vObj;
varying vec3 vN;
varying vec3 vV;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float f = pow(1.0 - abs(dot(n, v)), 2.0);
  float t = uTime;
  vec3 q = vObj * uFreq * 1.6;
  float n1 = snoise(q*1.5 + vec3(t*0.45*uFlow, 0.0, t*0.3)) * 0.5 + 0.5;
  float n2 = snoise(q*3.0 - vec3(0.0, t*0.55*uFlow, 0.0)) * 0.5 + 0.5;
  float e = pow(n1*0.6 + n2*0.4, 2.2);
  vec3 col = mix(uColA, uColHot, e) * (0.45 + e*1.6) + uColRim * f * 0.4;
  gl_FragColor = vec4(col, clamp((0.12 + e*0.55 + f*0.2) * uAlpha, 0.0, 1.0));
}
`;

export const GLOW_VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** Tight halo and outward pulse rings (Suggesting). Wide bloom is drawn in CSS to avoid canvas clipping. */
export const GLOW_FRAGMENT = /* glsl */ `
varying vec2 vUv;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColRim;
uniform float uGlow;
uniform float uPulseAmp;
uniform float uPulseT;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float halo = exp(-r*r*9.0) * uGlow;
  float edge = smoothstep(1.0, 0.7, r);
  float ring = 0.0;
  for (int i = 0; i < 2; i++) {
    float ph = fract(uPulseT*0.22 + float(i)*0.5);
    float rr = mix(0.30, 0.68, ph);
    float k = (1.0 - ph);
    ring += exp(-pow((r - rr)*11.0, 2.0)) * k * k;
  }
  ring *= uPulseAmp;
  vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.7, r)) * halo + uColRim * ring * 0.8;
  float a = (halo*0.5 + ring*0.5) * edge;
  gl_FragColor = vec4(col, a);
}
`;
