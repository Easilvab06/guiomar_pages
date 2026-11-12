// Iluminación de la seda: gradiente por altura (negro → rojo marca → rojo
// incandescente), especular Blinn-Phong, borde fresnel, viñeta y grano.

uniform float uTime;
uniform float uProgress;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorHot;
uniform vec3 uColorSheen;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vViewPosition;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Luz principal (arriba-izquierda) y luz de contra (derecha) en espacio de vista
  vec3 keyLight = normalize(vec3(-0.45, 0.75, 0.6));
  vec3 rimLight = normalize(vec3(0.8, -0.2, 0.35));

  float diffuse = max(dot(normal, keyLight), 0.0);
  float rim = max(dot(normal, rimLight), 0.0);

  vec3 halfway = normalize(keyLight + viewDir);
  float specular = pow(max(dot(normal, halfway), 0.0), 64.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  // La mayor parte de la superficie queda en sombra; solo las crestas se encienden
  float heat = smoothstep(-0.35, 0.95, vElevation);
  vec3 color = mix(uColorDeep, uColorMid, pow(heat, 1.7));
  color = mix(color, uColorHot, smoothstep(0.78, 1.0, heat) * 0.7);

  color *= 0.08 + pow(diffuse, 1.6) * 1.1;
  color += uColorMid * pow(rim, 2.0) * 0.18;
  color += uColorSheen * specular * 0.45;
  color += uColorMid * fresnel * 0.12;

  // Viñeta y oscurecimiento al salir del hero
  float vignette = smoothstep(0.95, 0.15, length((vUv - vec2(0.5, 0.55)) * vec2(1.0, 1.35)));
  color *= mix(0.12, 1.0, vignette);
  color *= 1.0 - uProgress * 0.75;

  // Grano de película animado (evita banding en gradientes oscuros)
  float grain = hash12(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5;
  color += grain * 0.028;

  gl_FragColor = vec4(max(color, 0.0), 1.0);

  #include <colorspace_fragment>
}
