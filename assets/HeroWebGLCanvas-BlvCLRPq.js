import{a as e}from"./motion-60UNJKgq.js";import{c as t,d as n,f as r,g as i,l as ee,m as a,o as te,s as ne,u as re}from"./index-Bc_pVgSB.js";import{A as ie,C as ae,D as oe,F as o,I as s,N as se,S as ce,a as le,j as ue,k as de,l as c,v as fe,w as l}from"./three-Dp9RMW3W.js";var pe=`// Seda líquida: malla subdividida desplazada por ruido Simplex 3D con
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
`,me=`// Iluminación de la seda: gradiente por altura (negro → rojo marca → rojo
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
`,u=6,he=-.62,d=ee({__name:`HeroWebGLCanvas`,props:{amplitude:{default:.55},mouseEase:{default:.075},maxPixelRatio:{default:1.75}},emits:[`ready`,`fallback`],setup(ee,{expose:d,emit:ge}){let f=ee,p=ge,m=a(null),h=a(null),g=a(!1),_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=null,T=null,E=new se,D=!0,O=!document.hidden,k=!1,A=!1,j=!1,M=0,N=new o(.15,.1),P=new o(.15,.1),F=new o(0,0),I=0,L=.35,R=null,z=new oe,B=new ae,V=new s,H=new s,U=new o(.5,.5),W={deep:`#060203`,mid:`#c2111b`,hot:`#ff5a3c`,sheen:`#ffd9cf`};function G(e,t,n,r){let i=1-(1-n)**(r/(1e3/60));return e+(t-e)*i}function K(e){let t=R;if(!t)return;let n=(e.clientX-t.left)/t.width*2-1,r=-((e.clientY-t.top)/t.height)*2+1;I=Math.min(Math.hypot(n-F.x,r-F.y)*14,1),F.set(n,r),N.set(n,r)}function q(){O=!document.hidden,$()}function J(e){e.preventDefault(),k=!0,$()}function Y(){k=!1,$()}function _e(){if(!y)return{width:1,height:1};let e=y.fov*Math.PI/180,t=2*Math.tan(e/2)*u;return{width:t*y.aspect*1.7,height:t*2.8}}function ve(e){return e<640?96:e<1200?150:200}function ye(e){if(!S)return;let t=ve(e);if(t===M&&b)return;let n=new l(1,1,t,Math.round(t*.9));b?.dispose(),b=n,S.geometry=n,M=t}function X(){let e=m.value;if(!e||!_||!y||!S||!C)return;let t=Math.max(e.clientWidth,1),n=Math.max(e.clientHeight,1);R=e.getBoundingClientRect(),_.setPixelRatio(Math.min(window.devicePixelRatio,f.maxPixelRatio)),_.setSize(t,n,!1),y.aspect=t/n,y.updateProjectionMatrix();let r=_e();S.scale.set(r.width,r.height,1),S.updateMatrixWorld(),C.uPlaneSize.value.set(r.width,r.height),ye(t),j&&Z(0)}function be(){y&&S&&(z.setFromCamera(P,y),V.set(0,0,1).applyQuaternion(S.quaternion),B.setFromNormalAndCoplanarPoint(V,S.position),z.ray.intersectPlane(B,H)&&(S.worldToLocal(H),U.set(H.x+.5,H.y+.5)))}function Z(e){if(_&&v&&y&&C){if(e>0){E.update(),C.uTime.value=E.getElapsed(),P.x=G(P.x,N.x,f.mouseEase,e),P.y=G(P.y,N.y,f.mouseEase,e),be();let t=C.uMouse.value;t.x=G(t.x,U.x,.12,e),t.y=G(t.y,U.y,.12,e),L=.3+I*.7,I=G(I,0,.04,e),C.uMouseStrength.value=G(C.uMouseStrength.value,L,.05,e),y.position.x=G(y.position.x,P.x*.25,.04,e),y.position.y=G(y.position.y,P.y*.15,.04,e),y.lookAt(0,0,0)}_.render(v,y)}}let Q=(e,t)=>{Z(Math.min(t,50))};function $(){let t=D&&O&&!k&&!j&&_!==null;t&&!A?(E.reset(),e.ticker.add(Q),A=!0):!t&&A&&(e.ticker.remove(Q),A=!1)}function xe(e){try{return e.getContext(`webgl2`)!==null}catch{return!1}}function Se(){let e=h.value,t=m.value;if(e&&t){if(!xe(document.createElement(`canvas`)))p(`fallback`,`webgl2-unavailable`);else{j=te();try{_=new le({canvas:e,antialias:!1,alpha:!1,powerPreference:`high-performance`,stencil:!1,depth:!0})}catch(e){p(`fallback`,e instanceof Error?e.message:`renderer-error`);return}_.outputColorSpace=de,_.setClearColor(W.deep,1),v=new ie,y=new ce(35,1,.1,50),y.position.set(0,0,u),C={uTime:{value:0},uMouse:{value:new o(.5,.5)},uMouseStrength:{value:.3},uProgress:{value:0},uPlaneSize:{value:new o(1,1)},uAmplitude:{value:f.amplitude},uColorDeep:{value:new c(W.deep)},uColorMid:{value:new c(W.mid)},uColorHot:{value:new c(W.hot)},uColorSheen:{value:new c(W.sheen)}},x=new ue({vertexShader:pe,fragmentShader:me,uniforms:C}),b=new l(1,1,2,2),S=new fe(b,x),S.rotation.x=he,S.position.set(0,-.35,0),S.frustumCulled=!1,v.add(S),X(),e.addEventListener(`webglcontextlost`,J),e.addEventListener(`webglcontextrestored`,Y),window.addEventListener(`pointermove`,K,{passive:!0}),document.addEventListener(`visibilitychange`,q),w=new ResizeObserver(X),w.observe(t),T=new IntersectionObserver(e=>{let n=e[0];D=!n||n.isIntersecting,D&&(R=t.getBoundingClientRect()),$()},{rootMargin:`64px`}),T.observe(t),_.compile(v,y),Z(0),$(),g.value=!0,p(`ready`)}}}function Ce(e){C&&(C.uProgress.value=Math.min(Math.max(e,0),1),j&&Z(0))}return d({setProgress:Ce}),re(Se),n(()=>{e.ticker.remove(Q),A=!1,E.dispose(),w?.disconnect(),w=null,T?.disconnect(),T=null,window.removeEventListener(`pointermove`,K),document.removeEventListener(`visibilitychange`,q);let t=_?.domElement;t?.removeEventListener(`webglcontextlost`,J),t?.removeEventListener(`webglcontextrestored`,Y),S&&v?.remove(S),b?.dispose(),x?.dispose(),v?.clear(),_&&(_.renderLists.dispose(),_.dispose(),_.forceContextLoss()),_=null,v=null,y=null,b=null,x=null,S=null,C=null,R=null}),(e,n)=>(r(),t(`div`,{ref_key:`containerRef`,ref:m,class:`absolute inset-0 overflow-hidden`,"aria-hidden":`true`},[ne(`canvas`,{ref_key:`canvasRef`,ref:h,class:i([`block h-full w-full transition-opacity duration-[1600ms] ease-(--ease-out-expo)`,g.value?`opacity-100`:`opacity-0`])},null,2)],512))}});export{d as default};