'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  density?: number;
  intensity?: number;
}

export default function FairyLightsBackground({ density = 1, intensity = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    Object.assign(renderer.domElement.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
    });
    container.appendChild(renderer.domElement);

    // Bokeh particles
    const bokehCount = Math.round(180 * density);
    const bokehPos  = new Float32Array(bokehCount * 3);
    const bokehSize = new Float32Array(bokehCount);
    const bokehSeed = new Float32Array(bokehCount);
    for (let i = 0; i < bokehCount; i++) {
      bokehPos[i*3]   = (Math.random() - 0.5) * 60;
      bokehPos[i*3+1] = (Math.random() - 0.5) * 30;
      bokehPos[i*3+2] = -10 - Math.random() * 35;
      bokehSize[i] = 0.4 + Math.random() * 1.6;
      bokehSeed[i] = Math.random() * Math.PI * 2;
    }
    const bokehGeo = new THREE.BufferGeometry();
    bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute('aSize',    new THREE.BufferAttribute(bokehSize, 1));
    bokehGeo.setAttribute('aSeed',    new THREE.BufferAttribute(bokehSeed, 1));

    const bokehMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime:      { value: 0 },
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
          vec3 warm = mix(vec3(0.96, 0.82, 0.45), vec3(1.0, 0.93, 0.7), fract(vSeed));
          vec3 col = warm * (core * 1.4 + halo * 0.5);
          gl_FragColor = vec4(col, (core * 0.85 + halo * 0.35) * vAlpha * uIntensity);
        }
      `,
    });
    scene.add(new THREE.Points(bokehGeo, bokehMat));

    // String lights
    const bulbsGroup = new THREE.Group();
    const wireGroup  = new THREE.Group();
    scene.add(bulbsGroup);
    scene.add(wireGroup);

    function makeHaloTex(): THREE.Texture {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0,    'rgba(255,240,180,1)');
      grd.addColorStop(0.15, 'rgba(255,220,140,0.7)');
      grd.addColorStop(0.45, 'rgba(220,160,70,0.25)');
      grd.addColorStop(1,    'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }
    const haloTex = makeHaloTex();

    const wireMat = new THREE.LineBasicMaterial({ color: 0x2a1f12, transparent: true, opacity: 0.55 });
    const bulbGeo = new THREE.SphereGeometry(0.18, 16, 16);

    function makeSwag(yBase: number, xSpan: number, sag: number, count: number, depth: number) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const x = -xSpan/2 + xSpan * t;
        const y = yBase - sag * 4 * t * (1 - t);
        pts.push(new THREE.Vector3(x, y, depth));
      }
      wireGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));

      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = -xSpan/2 + xSpan * t;
        const s = 4 * t * (1 - t);
        const y = yBase - sag * s - 0.45;

        const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfde2a0), transparent: true, opacity: 0.95 });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(x, y, depth);
        bulb.userData = { seed: Math.random() * Math.PI * 2, baseY: y, baseX: x };
        bulbsGroup.add(bulb);

        const haloMat = new THREE.SpriteMaterial({ map: haloTex, color: 0xf5cf6f, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const halo = new THREE.Sprite(haloMat);
        halo.scale.set(2.2, 2.2, 1);
        halo.position.copy(bulb.position);
        halo.userData = { bulb };
        bulbsGroup.add(halo);

        const dropPts = [new THREE.Vector3(x, yBase - sag * s, depth), new THREE.Vector3(x, y + 0.18, depth)];
        wireGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(dropPts), wireMat));
      }
    }

    makeSwag(7.5, 32, 2.5, Math.round(11 * density), -2);
    makeSwag(6.2, 28, 2.0, Math.round(9  * density), -4);
    makeSwag(8.5, 36, 3.2, Math.round(13 * density), -6);

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.6;
      mouse.y = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.4;
    };
    container.addEventListener('mousemove', onMouseMove);

    const ro = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(container);

    const clock = new THREE.Clock();
    let raf: number;

    const tick = () => {
      const t = clock.getElapsedTime();
      bokehMat.uniforms.uTime.value = t;

      bulbsGroup.children.forEach((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const s = mesh.userData.seed as number;
          mesh.position.x = (mesh.userData.baseX as number) + Math.sin(t * 0.6 + s) * 0.06;
          mesh.position.y = (mesh.userData.baseY as number) + Math.sin(t * 0.9 + s * 1.3) * 0.04;
          const flick = 0.85 + 0.15 * Math.sin(t * 2.5 + s * 4.0) + (Math.random() < 0.005 ? -0.1 : 0);
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.6, Math.min(1, flick));
        } else if ((obj as THREE.Sprite).isSprite && obj.userData.bulb) {
          const sprite = obj as THREE.Sprite;
          const b = obj.userData.bulb as THREE.Mesh;
          sprite.position.copy(b.position);
          const s = b.userData.seed as number;
          sprite.material.opacity = (0.85 + 0.2 * Math.sin(t * 2.0 + s * 3.0)) * intensity;
        }
      });

      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 1.0  - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      bokehGeo.dispose();
      bokehMat.dispose();
      haloTex.dispose();
      bulbGeo.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [density, intensity]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
}
