/* ============================================================
   WebGL bokeh + asılı ampul sahnesi (Three.js)
   - Asılı kablolu ampuller sallanır, parıldar
   - Arka planda derinlikli bokeh ışık parçacıkları
   - Hafif ağaç silüetleri (CSS gradient + parallax)
   ============================================================ */

function FairyLightsScene({ mountId, density = 1, intensity = 1 }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const container = ref.current;
    if (!container || !window.THREE) return;
    const THREE = window.THREE;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1208, 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // ---------- Bokeh particles (background) ----------
    const bokehCount = Math.round(180 * density);
    const bokehGeo = new THREE.BufferGeometry();
    const bokehPos = new Float32Array(bokehCount * 3);
    const bokehSize = new Float32Array(bokehCount);
    const bokehSeed = new Float32Array(bokehCount);
    for (let i = 0; i < bokehCount; i++) {
      bokehPos[i*3]   = (Math.random() - 0.5) * 60;
      bokehPos[i*3+1] = (Math.random() - 0.5) * 30;
      bokehPos[i*3+2] = -10 - Math.random() * 35;
      bokehSize[i] = 0.4 + Math.random() * 1.6;
      bokehSeed[i] = Math.random() * Math.PI * 2;
    }
    bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute('aSize', new THREE.BufferAttribute(bokehSize, 1));
    bokehGeo.setAttribute('aSeed', new THREE.BufferAttribute(bokehSeed, 1));

    const bokehMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSeed;
        uniform float uTime;
        varying float vAlpha;
        varying float vSeed;
        void main() {
          vSeed = aSeed;
          vec3 pos = position;
          pos.y += sin(uTime * 0.3 + aSeed) * 0.3;
          pos.x += cos(uTime * 0.2 + aSeed * 1.7) * 0.2;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          float pulse = 0.7 + 0.3 * sin(uTime * 1.2 + aSeed * 3.0);
          vAlpha = pulse;
          gl_PointSize = aSize * 80.0 * pulse / -mv.z;
        }
      `,
      fragmentShader: `
        uniform float uIntensity;
        varying float vAlpha;
        varying float vSeed;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.0, d);
          float halo = smoothstep(0.5, 0.15, d);
          // Warm gold tint, slightly varied per seed
          vec3 warm = mix(vec3(0.96, 0.82, 0.45), vec3(1.0, 0.93, 0.7), fract(vSeed));
          vec3 col = warm * (core * 1.4 + halo * 0.5);
          gl_FragColor = vec4(col, (core * 0.85 + halo * 0.35) * vAlpha * uIntensity);
        }
      `
    });
    const bokehPoints = new THREE.Points(bokehGeo, bokehMat);
    scene.add(bokehPoints);

    // ---------- Hanging string lights (foreground) ----------
    // Two swag strings across the top
    const bulbsGroup = new THREE.Group();
    scene.add(bulbsGroup);

    const wireGroup = new THREE.Group();
    scene.add(wireGroup);

    function makeSwag(yBase, xSpan, sag, count, depth) {
      const points = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const x = -xSpan/2 + xSpan * t;
        // catenary-like
        const s = 4 * t * (1 - t); // 0..1..0
        const y = yBase - sag * s;
        points.push(new THREE.Vector3(x, y, depth));
      }
      const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x2a1f12,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(wireGeo, wireMat);
      wireGroup.add(line);

      // Bulbs along the swag
      const bulbGeo = new THREE.SphereGeometry(0.18, 16, 16);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = -xSpan/2 + xSpan * t;
        const s = 4 * t * (1 - t);
        const y = yBase - sag * s - 0.45; // hang below wire
        const bulbMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xfde2a0),
          transparent: true,
          opacity: 0.95,
        });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(x, y, depth);
        bulb.userData.seed = Math.random() * Math.PI * 2;
        bulb.userData.baseY = y;
        bulb.userData.baseX = x;
        bulbsGroup.add(bulb);

        // Halo sprite
        const haloMat = new THREE.SpriteMaterial({
          map: makeHaloTexture(),
          color: 0xf5cf6f,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const halo = new THREE.Sprite(haloMat);
        halo.scale.set(2.2, 2.2, 1);
        halo.position.copy(bulb.position);
        halo.userData.bulb = bulb;
        bulbsGroup.add(halo);

        // Tiny vertical drop wire from main wire to bulb
        const dropGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, yBase - sag * s, depth),
          new THREE.Vector3(x, y + 0.18, depth),
        ]);
        const drop = new THREE.Line(dropGeo, wireMat);
        wireGroup.add(drop);
      }
    }

    function makeHaloTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64,64,0, 64,64,64);
      grd.addColorStop(0,    'rgba(255,240,180,1)');
      grd.addColorStop(0.15, 'rgba(255,220,140,0.7)');
      grd.addColorStop(0.45, 'rgba(220,160,70,0.25)');
      grd.addColorStop(1,    'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0,0,128,128);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    // Two staggered swags
    makeSwag( 7.5, 32, 2.5, Math.round(11 * density), -2);
    makeSwag( 6.2, 28, 2.0, Math.round(9  * density), -4);
    makeSwag( 8.5, 36, 3.2, Math.round(13 * density), -6);

    // ---------- Far-back haze layer ----------
    const hazeGeo = new THREE.PlaneGeometry(80, 40);
    const hazeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        // simple value noise
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
          vec2 u=f*f*(3.0-2.0*f);
          return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
        }
        void main() {
          vec2 p = vUv * 3.0;
          float n = noise(p + uTime*0.02);
          n = n * 0.5 + 0.5 * noise(p*2.0 - uTime*0.015);
          // warm dusk gradient
          vec3 top = vec3(0.20, 0.16, 0.10);
          vec3 bot = vec3(0.36, 0.26, 0.14);
          vec3 col = mix(bot, top, vUv.y);
          col += n * 0.08;
          gl_FragColor = vec4(col, 0.0); // transparent — purely additive feel
        }
      `
    });
    // We don't actually need to draw the haze plane since CSS handles bg.
    // Keep the noise func reserved for future use.

    // ---------- Mouse parallax ----------
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.6;
      target.y = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.4;
    };
    container.addEventListener('mousemove', onMove);

    // ---------- Resize ----------
    const onResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ---------- Animate ----------
    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      const t = clock.getElapsedTime();
      bokehMat.uniforms.uTime.value = t;

      // Sway bulbs gently
      bulbsGroup.children.forEach((obj) => {
        if (obj.isMesh) {
          const s = obj.userData.seed || 0;
          obj.position.x = obj.userData.baseX + Math.sin(t * 0.6 + s) * 0.06;
          obj.position.y = obj.userData.baseY + Math.sin(t * 0.9 + s * 1.3) * 0.04;
          // pulsing brightness
          const flick = 0.85 + 0.15 * Math.sin(t * 2.5 + s * 4.0) + (Math.random() < 0.005 ? -0.1 : 0);
          obj.material.opacity = Math.max(0.6, Math.min(1, flick));
        } else if (obj.isSprite && obj.userData.bulb) {
          obj.position.copy(obj.userData.bulb.position);
          const s = obj.userData.bulb.userData.seed || 0;
          const pulse = 0.85 + 0.2 * Math.sin(t * 2.0 + s * 3.0);
          obj.material.opacity = pulse * intensity;
        }
      });

      // camera parallax
      camera.position.x += (target.x * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-target.y * 1.0 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('mousemove', onMove);
      renderer.dispose();
      bokehGeo.dispose();
      bokehMat.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [density, intensity]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

window.FairyLightsScene = FairyLightsScene;
