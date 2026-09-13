// Hero 3D del sitio del fotografo (S1 #182): camara construida con
// primitivas Three (sin GLB ni SDK externo), clonando el contrato de
// montaje de oficina-scene (renderer + IBL + OrbitControls + reduced-motion
// + dispose). Presets de vista sincronizados con ?vista= en la URL.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { VistaId } from '../lib/foto-vista';

export interface CamaraHandle {
  (): void;
  /** Mueve la camara al preset (frontal|lateral|lente). */
  setVista: (vista: VistaId) => void;
}

const VISTAS: Record<VistaId, { pos: [number, number, number]; tgt: [number, number, number] }> = {
  frontal: { pos: [0, 1.1, 6.2], tgt: [0, 0.9, 0] },
  lateral: { pos: [6.2, 1.3, 0.6], tgt: [0, 0.9, 0] },
  lente: { pos: [0.9, 1.0, 2.8], tgt: [0, 0.9, 1.1] },
};

function construyeCamara(): THREE.Group {
  const camara = new THREE.Group();
  const cuerpoMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.55 });
  const detalleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.4 });
  const vidrioMat = new THREE.MeshStandardMaterial({ color: 0x0e2a4a, roughness: 0.15, metalness: 0.4 });

  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.1), cuerpoMat);
  cuerpo.position.y = 0.9;
  camara.add(cuerpo);

  const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.2, 32), detalleMat);
  lente.rotation.x = Math.PI / 2;
  lente.position.set(0, 0.9, 1.1);
  camara.add(lente);

  const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), vidrioMat);
  vidrio.position.set(0, 0.9, 1.71);
  camara.add(vidrio);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), cuerpoMat);
  visor.position.set(0, 1.75, -0.1);
  camara.add(visor);

  for (const [x, r] of [[-0.8, 0.16], [0.8, 0.16]] as const) {
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.18, 20), detalleMat);
    dial.position.set(x, 1.72, 0.1);
    camara.add(dial);
  }

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0x554411, roughness: 0.3 }),
  );
  flash.position.set(0.7, 1.35, 0.56);
  camara.add(flash);
  camara.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return camara;
}

export function mountCamaraScene(canvas: HTMLCanvasElement, vistaInicial: VistaId): CamaraHandle {
  const container = canvas.parentElement ?? canvas;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x171310, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x171310);
  scene.fog = new THREE.Fog(0x171310, 20, 42);
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
    pmrem.dispose();
  }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xfff2e0, 0x2a2018, 0.25));
  const sol = new THREE.DirectionalLight(0xffedd5, 0.9);
  sol.position.set(5, 8, 6);
  sol.castShadow = true;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight(0x9db8ff, 0.15);
  relleno.position.set(-6, 3, -4);
  scene.add(relleno);

  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshStandardMaterial({ color: 0x2e2721, roughness: 0.95 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

  const camara = construyeCamara();
  scene.add(camara);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  // Teclado: flechas rotan, +/− zoom (canvas con tabindex en la página).
  controls.listenToKeyEvents(canvas);

  function setVista(vista: VistaId) {
    const v = VISTAS[vista];
    camera.position.set(...v.pos);
    controls.target.set(...v.tgt);
    controls.update();
  }
  setVista(vistaInicial);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto = reduced || new URLSearchParams(location.search).get('estatica') === '1';
  let raf = 0;
  let aLaVista = true;

  function resize() {
    const w = container.clientWidth || 640;
    const h = Math.max(Math.min(w * 0.62, 480), 300);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (quieto && aLaVista) foto();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function programa() {
    if (!raf && aLaVista && !quieto) raf = requestAnimationFrame(frame);
  }
  function foto() {
    controls.update();
    renderer.render(scene, camera);
  }
  if (quieto) {
    controls.addEventListener('change', () => {
      if (aLaVista) foto();
    });
  }
  function frame() {
    raf = 0;
    controls.update();
    renderer.render(scene, camera);
    programa();
  }
  const vigia = new IntersectionObserver(
    (entries) => {
      aLaVista = entries.some((e) => e.isIntersecting);
      if (quieto) {
        if (aLaVista) foto();
      } else programa();
    },
    { threshold: 0 },
  );
  vigia.observe(canvas);
  if (quieto) foto();
  else programa();
  canvas.dataset.mounted = 'true';

  function dispose() {
    vigia.disconnect();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    controls.dispose();
    const materiales = new Set<THREE.Material>();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) materiales.add(m as THREE.Material);
      }
    });
    for (const m of materiales) m.dispose();
    if (scene.environment) {
      (scene.environment as THREE.Texture).dispose();
      scene.environment = null;
    }
    renderer.dispose();
    delete canvas.dataset.mounted;
  }
  return Object.assign(dispose, { setVista });
}
