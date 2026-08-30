import * as THREE from 'three';

const STAR_COUNT = 3200;

function createStarTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(255,220,180,0.85)');
  gradient.addColorStop(0.45, 'rgba(255,140,80,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createStarfield(): {
  points: THREE.Points;
  baseZ: Float32Array;
  speeds: Float32Array;
} {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const baseZ = new Float32Array(STAR_COUNT);
  const speeds = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * 5.5;
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    const z = Math.random() * 40 - 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    baseZ[i] = z;
    speeds[i] = 0.4 + Math.random() * 1.4;

    const tint = Math.random();
    if (tint < 0.12) {
      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 1.0;
    } else if (tint < 0.2) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.72;
      colors[i * 3 + 2] = 0.45;
    } else {
      colors[i * 3] = 0.95;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 1.0;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return { points: new THREE.Points(geometry, material), baseZ, speeds };
}

function createNebulaGlow(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(4.8, 48, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0xc45a28,
    transparent: true,
    opacity: 0.14,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function createInnerHaze(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(2.4, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffa040,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function createCoreStar(texture: THREE.CanvasTexture): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.2, 4.2, 1);
  return sprite;
}

export function mountNebulaScene(canvas: HTMLCanvasElement): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container = canvas.closest('.nebula-scene') ?? canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020208, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020208, 0.045);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  camera.lookAt(0, 0, 0);

  const starTexture = createStarTexture();
  const { points: starfield, baseZ, speeds } = createStarfield();
  const positionAttr = starfield.geometry.getAttribute('position') as THREE.BufferAttribute;
  const nebula = createNebulaGlow();
  const haze = createInnerHaze();
  const core = createCoreStar(starTexture);

  scene.add(starfield);
  scene.add(nebula);
  scene.add(haze);
  scene.add(core);

  function resize() {
    if (!container) return;

    const width = container.clientWidth;
    const height = Math.max(Math.min(width * 0.76, 520), 320);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container!);

  let raf = 0;
  const start = performance.now();
  const warp = reducedMotion ? 0.35 : 6;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const elapsed = (now - start) * 0.001;

    const positions = positionAttr.array as Float32Array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const z = ((baseZ[i] + elapsed * speeds[i] * warp + 20) % 40) - 20;
      positions[i * 3 + 2] = z;
    }
    positionAttr.needsUpdate = true;

    nebula.rotation.y = elapsed * 0.04;
    nebula.rotation.z = elapsed * 0.02;
    haze.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.04);

    const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.08) * 0.06;
    camera.position.x = drift;
    camera.position.y = drift * 0.35;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  raf = requestAnimationFrame(frame);
  canvas.dataset.mounted = 'true';

  return () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();

    starfield.geometry.dispose();
    (starfield.material as THREE.Material).dispose();
    nebula.geometry.dispose();
    (nebula.material as THREE.Material).dispose();
    haze.geometry.dispose();
    (haze.material as THREE.Material).dispose();
    (core.material as THREE.Material).dispose();
    starTexture.dispose();
    renderer.dispose();
    delete canvas.dataset.mounted;
  };
}
