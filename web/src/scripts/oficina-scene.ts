// PROTOTYPE — throwaway (ticket: Oficina Three.js, variante A).
// Escena low-poly: piso + 6 objetos clicables (raycast) + OrbitControls con
// damping. Copia el cleanup de nebula-scene.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJETO_A_MODULO, OBJETO_LABEL, type Objeto3DId } from '../lib/oficina-mapping';

export type SeleccionCb = (objeto: Objeto3DId, modulo: string) => void;

const COLORES: Record<Objeto3DId, number> = {
  'mostrador-3d': 0x1a3a52,
  'estanteria-3d': 0x8a5a2b,
  'gondola-3d': 0x2b7a4b,
  'computadora-3d': 0x3b3b3b,
  'pizarron-fiscal-3d': 0xc45a28,
  'puerta-crecer-3d': 0x6a4a8a,
};

export interface OficinaHandle {
  (): void;
  /** Marca el objeto en la escena (null = limpia). Aditivo: el dispose sigue siendo llamable. */
  resaltar: (id: Objeto3DId | null) => void;
}

export function mountOficinaScene(
  canvas: HTMLCanvasElement,
  onPick: SeleccionCb,
  etiquetas?: HTMLElement,
): OficinaHandle {
  const container = canvas.parentElement ?? canvas;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xf5f5f5, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Maquillaje (manual: shadows + color management): una sola direccional
  // proyecta (shadow maps = 1 render extra, no 1 por luz), suavizado PCF y
  // tone mapping fílmico para no quemar blancos.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(6.5, 5.5, 8);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sol = new THREE.DirectionalLight(0xffffff, 1.2);
  sol.position.set(5, 8, 4);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -8;
  sol.shadow.camera.right = 8;
  sol.shadow.camera.top = 8;
  sol.shadow.camera.bottom = -8;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 25;
  scene.add(sol);

  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d6 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

  // Cada objeto = un Group con userData.objeto; el raycast es recursivo y
  // sube por padres hasta encontrar el grupo (los muebles tienen piezas).
  const raices: THREE.Group[] = [];
  const grupo = new THREE.Group();
  scene.add(grupo);

  function raiz(id: Objeto3DId): THREE.Group {
    const g = new THREE.Group();
    g.userData.objeto = id;
    grupo.add(g);
    raices.push(g);
    return g;
  }

  function pieza(
    g: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    extra?: { emissive?: number; fijo?: boolean },
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        emissive: extra?.emissive ?? 0x000000,
      }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (extra?.fijo) m.userData.fijo = true; // brillo propio, no lo pisa el highlight
    g.add(m);
    return m;
  }

  function resaltar(id: Objeto3DId | null) {
    for (const g of raices) {
      const activo = g.userData.objeto === id;
      g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !mesh.userData.fijo) {
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(activo ? 0x554411 : 0x000000);
        }
      });
    }
  }

  // Mostrador (2 cajas) — frente
  {
    const g = raiz('mostrador-3d');
    const c = COLORES['mostrador-3d'];
    pieza(g, 3.4, 0.9, 0.8, -1.5, 0.45, 2.6, c); // cuerpo
    pieza(g, 3.6, 0.08, 1.0, -1.5, 0.94, 2.6, 0x2e5a7c); // tapa
    for (const x of [-2.2, -0.8]) {
      pieza(g, 0.4, 0.28, 0.4, x, 1.12, 2.6, 0x222831); // registradora
      pieza(g, 0.3, 0.2, 0.04, x, 1.32, 2.45, 0x111111, { emissive: 0x3a7ca5, fijo: true }); // pantalla
    }
  }
  // Estantería / depósito — izquierda (3 niveles con mercadería)
  {
    const g = raiz('estanteria-3d');
    const c = COLORES['estanteria-3d'];
    for (const y of [0.4, 1.2, 2.0]) pieza(g, 0.6, 0.08, 3.2, -4.6, y, -0.5, c);
    for (const z of [-2.06, 1.06]) pieza(g, 0.6, 2.4, 0.08, -4.6, 1.2, z, c);
    const merc = [0xd9c9a8, 0xb7c4c9, 0xc9a8b7];
    [0.65, 1.45, 2.25].forEach((y, i) => {
      pieza(g, 0.4, 0.3, 0.5, -4.6, y, -1.3, merc[i % 3]);
      pieza(g, 0.4, 0.3, 0.5, -4.6, y, 0.3, merc[(i + 1) % 3]);
    });
  }
  // Góndola / ventas — centro (base + dos niveles)
  {
    const g = raiz('gondola-3d');
    const c = COLORES['gondola-3d'];
    pieza(g, 1.0, 0.9, 2.4, 0.2, 0.45, -0.3, c);
    pieza(g, 0.9, 0.5, 2.2, 0.2, 1.15, -0.3, 0x35945e);
    pieza(g, 0.94, 0.22, 0.5, 0.2, 1.5, -0.3, 0xd9c9a8); // cartel superior
  }
  // Computadora / compras — derecha (mesa + monitor encendido + teclado)
  {
    const g = raiz('computadora-3d');
    const c = COLORES['computadora-3d'];
    pieza(g, 1.8, 0.08, 0.9, 3.4, 0.75, 1.4, 0x5a5348); // tapa mesa
    for (const x of [2.6, 4.2]) pieza(g, 0.08, 0.75, 0.9, x, 0.37, 1.4, c);
    pieza(g, 1.1, 0.7, 0.06, 3.4, 1.3, 1.1, 0x222831); // marco monitor
    pieza(g, 0.95, 0.55, 0.065, 3.4, 1.3, 1.1, 0x111111, { emissive: 0x9fd4ff, fijo: true }); // pantalla
    pieza(g, 0.7, 0.05, 0.25, 3.4, 0.82, 1.7, 0x222831); // teclado
  }
  // Pizarrón fiscal — fondo (marco + superficie + patas)
  {
    const g = raiz('pizarron-fiscal-3d');
    const c = COLORES['pizarron-fiscal-3d'];
    pieza(g, 2.5, 1.5, 0.08, 0.5, 2.0, -3.6, 0x7a3a1a); // marco
    pieza(g, 2.3, 1.3, 0.09, 0.5, 2.0, -3.6, 0xe8ddc8); // superficie
    for (const x of [-0.4, 1.4]) pieza(g, 0.1, 1.3, 0.1, x, 0.65, -3.6, 0x4a4a4a);
  }
  // Puerta "crecer" — fondo derecha (marco + hoja + picaporte)
  {
    const g = raiz('puerta-crecer-3d');
    const c = COLORES['puerta-crecer-3d'];
    pieza(g, 1.5, 2.6, 0.12, 3.8, 1.3, -3.6, 0x4a3468); // marco
    pieza(g, 1.2, 2.4, 0.14, 3.8, 1.2, -3.6, c); // hoja
    pieza(g, 0.12, 0.12, 0.2, 3.35, 1.2, -3.55, 0xd9c9a8, { emissive: 0x554411, fijo: true }); // picaporte
  }

  // Carteles HTML alineados a 3D (manual: align-html-elements-to-3d):
  // texto real (seleccionable, con CSS) proyectado cada frame.
  const ANCLAS: Record<Objeto3DId, [number, number, number]> = {
    'mostrador-3d': [-1.5, 1.75, 2.6],
    'estanteria-3d': [-4.6, 2.75, -0.5],
    'gondola-3d': [0.2, 1.95, -0.3],
    'computadora-3d': [3.4, 2.05, 1.2],
    'pizarron-fiscal-3d': [0.5, 2.95, -3.6],
    'puerta-crecer-3d': [3.8, 2.95, -3.6],
  };
  const cartelDe = new Map<Objeto3DId, HTMLDivElement>();
  if (etiquetas) {
    for (const id of Object.keys(ANCLAS) as Objeto3DId[]) {
      const div = document.createElement('div');
      div.className = 'oficina-cartel';
      div.textContent = OBJETO_LABEL[id];
      etiquetas.appendChild(div);
      cartelDe.set(id, div);
    }
  }
  const proy = new THREE.Vector3();
  let seleccionado: Objeto3DId | null = null;
  function pintaCarteles() {
    if (!etiquetas || cartelDe.size === 0) return;
    const w = container.clientWidth || 640;
    const h = canvas.clientHeight || 400;
    for (const [id, div] of cartelDe) {
      const a = ANCLAS[id];
      proy.set(a[0], a[1], a[2]).project(camera);
      const x = (proy.x * 0.5 + 0.5) * w;
      const y = (-proy.y * 0.5 + 0.5) * h;
      // Oculto si está detrás de cámara o fuera del canvas (con margen)
      const visible = proy.z < 1 && x > -40 && x < w + 40 && y > -20 && y < h + 20;
      div.style.display = visible ? 'block' : 'none';
      if (!visible) continue;
      div.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      div.classList.toggle('oficina-cartel--activo', seleccionado === id);
    }
  }
  // Reemplaza el drag/zoom manual: mismo rango, más tacto nativo (pinch).
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.6, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.update();

  // Click (raycast) — distingue de drag por distancia
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let downX = 0;
  let downY = 0;
  const onDownPos = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
  };
  const onClick = (e: MouseEvent) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
    const r = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(raices, true)[0];
    if (!hit) return;
    // Sube por padres hasta el grupo con userData.objeto (las piezas no lo tienen)
    let nodo: THREE.Object3D | null = hit.object;
    while (nodo && !nodo.userData.objeto) nodo = nodo.parent;
    if (!nodo) return;
    const id = nodo.userData.objeto as Objeto3DId;
    resaltar(id);
    seleccionado = id;
    if (reduced && aLaVista) foto();
    else pintaCarteles();
    onPick(id, OBJETO_A_MODULO[id]);
  };
  canvas.addEventListener('pointerdown', onDownPos);
  canvas.addEventListener('click', onClick);

  // Estado compartido ANTES de resize(): resize() corre de inmediato y lee
  // estas variables (si van después, mueren por zona muerta temporal).
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let aLaVista = true;

  function resize() {
    const w = container.clientWidth || 640;
    const h = Math.max(Math.min(w * 0.62, 480), 300);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduced && aLaVista) foto();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // Pausa fuera de pantalla (manual "rendering on demand"): sin frames
  // programados mientras el canvas no intersecta el viewport.
  const t0 = performance.now();
  function programa() {
    if (!raf && aLaVista && !reduced) raf = requestAnimationFrame(frame);
  }
  // Movimiento reducido: un frame fijo por evento, sin loop
  // (manual: rendering on demand).
  function foto() {
    controls.update();
    renderer.render(scene, camera);
    pintaCarteles();
  }
  if (reduced) {
    controls.addEventListener('change', () => {
      if (aLaVista) foto();
    });
  }
  function frame(now: number) {
    raf = 0;
    const t = (now - t0) * 0.001;
    controls.update();
    if (!reduced) grupo.position.y = Math.sin(t * 0.8) * 0.015;
    renderer.render(scene, camera);
    pintaCarteles();
    programa();
  }
  const vigia = new IntersectionObserver(
    (entries) => {
      aLaVista = entries.some((e) => e.isIntersecting);
      if (reduced) {
        if (aLaVista) foto();
      } else programa();
    },
    { threshold: 0 },
  );
  vigia.observe(canvas);
  if (reduced) foto();
  else programa();
  canvas.dataset.mounted = 'true';

  function dispose() {
    vigia.disconnect();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    controls.dispose();
    cartelDe.clear();
    if (etiquetas) etiquetas.innerHTML = '';
    canvas.removeEventListener('pointerdown', onDownPos);
    canvas.removeEventListener('click', onClick);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });
    renderer.dispose();
    delete canvas.dataset.mounted;
  }
  return Object.assign(dispose, { resaltar });
}
