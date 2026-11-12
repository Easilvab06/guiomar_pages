// Seda líquida: malla subdividida desplazada por ruido Simplex 3D con
// domain warping + una onda local que sigue al cursor.

uniform float uTime;
uniform vec2 uMouse;          // Coordenadas UV del cursor sobre el plano (suavizadas con lerp)
uniform float uMouseStrength; // 0..1, crece con la velocidad del puntero
uniform float uProgress;      // 0..1, progreso de salida del hero al hacer scroll
uniform vec2 uPlaneSize;      // Tamaño del plano en unidades de mundo
uniform float uAmplitude;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vViewPosition;

// ---------------------------------------------------------------------------
// Simplex noise 3D — Ian McEwan, Stefan Gustavson (Ashima Arts). Licencia MIT.
// ---------------------------------------------------------------------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
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

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Altura de la superficie en un punto del plano (coordenadas locales -0.5..0.5)
float elevationAt(vec2 local) {
  vec2 p = local * uPlaneSize;
  vec2 uv = local + 0.5;
  float t = uTime * 0.11;

  // Domain warping: el ruido desplaza las coordenadas de otro ruido → pliegues de tela
  vec2 warp = vec2(
    snoise(vec3(p * 0.28, t)),
    snoise(vec3(p * 0.28 + 7.3, t + 3.1))
  );
  vec2 q = p + warp * 1.1;

  // Pliegues alargados en diagonal (como tela tensada) + detalle fino
  vec2 r = vec2(q.x * 0.8 + q.y * 0.45, q.y * 0.8 - q.x * 0.45);
  float folds = snoise(vec3(r.x * 0.32, r.y * 1.15 - t * 1.4, t * 0.7));
  float detail = snoise(vec3(q * 1.3, t * 1.6)) * 0.1;

  // Onda local del cursor (gaussiana + anillos que se propagan)
  vec2 aspect = vec2(uPlaneSize.x / uPlaneSize.y, 1.0);
  float d = length((uv - uMouse) * aspect);
  float bulge = exp(-d * d * 9.0) * uMouseStrength;
  float rings = sin(d * 26.0 - uTime * 4.0) * exp(-d * 5.0) * uMouseStrength * 0.12;

  float e = (folds + detail) * uAmplitude + bulge * 0.95 + rings;
  return e * (1.0 - uProgress * 0.65);
}

void main() {
  vUv = uv;
  vec2 local = position.xy;

  float e = elevationAt(local);

  // Normal analítica por diferencias finitas (sombreado suave, sin facetas)
  float eps = 1.0 / 220.0;
  float ex = elevationAt(local + vec2(eps, 0.0));
  float ey = elevationAt(local + vec2(0.0, eps));
  vec3 tangentX = vec3(eps * uPlaneSize.x, 0.0, ex - e);
  vec3 tangentY = vec3(0.0, eps * uPlaneSize.y, ey - e);
  vec3 objectNormal = normalize(cross(tangentX, tangentY));

  vec3 displaced = vec3(position.xy, e);
  vElevation = e;
  vNormal = normalize(normalMatrix * objectNormal);

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
