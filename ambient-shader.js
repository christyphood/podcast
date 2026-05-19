(function (global) {
  'use strict';

  var VERTEX_SHADER = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }'
  ].join('\n');

  var FRAGMENT_SHADER = [
    'uniform float u_time;',
    'uniform float u_energy;',
    'uniform vec2 u_resolution;',
    'varying vec2 vUv;',
    'vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}',
    'vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}',
    'vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);',
    '  vec2 i  = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;',
    '  i = mod289(i);',
    '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m; m = m*m;',
    '  vec3 x = 2.0*fract(p*C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);',
    '  vec3 g;',
    '  g.x  = a0.x*x0.x + h.x*x0.y;',
    '  g.yz = a0.yz*x12.xz + h.yz*x12.yw;',
    '  return 130.0*dot(m,g);',
    '}',
    'float random(vec2 st){ return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123); }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  vec2 st = uv; st.x *= u_resolution.x / u_resolution.y;',
    '  float t = u_time * 0.12;',
    '  vec2 q; q.x = snoise(st + vec2(t, t)); q.y = snoise(st + vec2(-t, t*1.2));',
    '  vec2 r; r.x = snoise(st + 2.0*q + vec2(t*1.5, t*0.8)); r.y = snoise(st + 2.0*q + vec2(-t*0.5, t*1.1));',
    '  float f = snoise(st + 3.0*r);',
    '  vec3 colBlue = vec3(47.0/255.0, 54.0/255.0, 241.0/255.0);',
    '  vec3 colPink = vec3(249.0/255.0, 73.0/255.0, 224.0/255.0);',
    '  vec3 colPeach = vec3(255.0/255.0, 177.0/255.0, 122.0/255.0);',
    '  vec3 colLightPurple = vec3(140.0/255.0, 126.0/255.0, 253.0/255.0);',
    '  vec3 color = mix(colBlue, colLightPurple, clamp((f*f)*2.0, 0.0, 1.0));',
    '  color = mix(color, colPink, clamp(length(q)*1.5, 0.0, 1.0));',
    '  color = mix(color, colPeach, clamp(length(r.x)*1.2, 0.0, 1.0));',
    '  vec3 rhythmTint = mix(colPink, colPeach, 0.45);',
    '  color = mix(color, rhythmTint, u_energy * 0.14);',
    '  float grain = random(uv*(u_time * 0.12 + 10.0));',
    '  color += (grain - 0.5)*0.35;',
    '  gl_FragColor = vec4(color, 1.0);',
    '}'
  ].join('\n');

  function mount(container, options) {
    options = options || {};
    if (!container || typeof global.THREE === 'undefined') return null;

    var THREE = global.THREE;
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    var material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0 },
        u_energy: { value: options.energy || 0 },
        u_resolution: { value: new THREE.Vector2(1, 1) }
      }
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    var clock = new THREE.Clock();
    var paused = false;
    var rafId = 0;
    var resizeObserver = null;

    function resize() {
      var w = container.clientWidth;
      var h = container.clientHeight;
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
      material.uniforms.u_resolution.value.set(w, h);
    }

    function tick() {
      rafId = global.requestAnimationFrame(tick);
      if (paused) return;
      material.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    }

    function setEnergy(value) {
      material.uniforms.u_energy.value = value;
    }

    function setPaused(value) {
      paused = !!value;
      if (!paused) clock.getElapsedTime();
    }

    function destroy() {
      paused = true;
      if (rafId) global.cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      global.removeEventListener('resize', resize);
      renderer.dispose();
      material.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    global.addEventListener('resize', resize);
    resize();
    global.setTimeout(resize, 80);
    global.setTimeout(resize, 400);

    if (typeof global.ResizeObserver !== 'undefined') {
      resizeObserver = new global.ResizeObserver(resize);
      resizeObserver.observe(container);
    }

    tick();

    return { resize: resize, setEnergy: setEnergy, setPaused: setPaused, destroy: destroy };
  }

  global.AeroAmbient = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
