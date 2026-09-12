// PROTOTYPE — throwaway (rama prototype/empresa-zonas, ticket #159).
// Empresa por zonas: base de oficina-scene + 7ma zona logística + IBL
// (RoomEnvironment+PMREM, 0KB red) sobre los MeshStandardMaterial existentes.
// El path GLTF real (loadEmpresaGLB) intenta cargar y cae al procedural:
// eso ejercita la cascada de fallback decidida en el mapa.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OBJETO_A_MODULO, OBJETO_LABEL, type Objeto3DId } from '../lib/oficina-mapping';

export type SeleccionCb = (objeto: Objeto3DId, modulo: string) => void;

/** Estado visual por respuesta del panel: apagado (sin preguntar), fantasma (No), encendido (Sí). */
export type EstadoObjeto3D = 'apagado' | 'fantasma' | 'encendido';

const COLORES: Record<Objeto3DId, number> = {
  'mostrador-3d': 0x274b68,
  'estanteria-3d': 0x9a6530,
  'gondola-3d': 0x2f8a52,
  'computadora-3d': 0x4a4a4a,
  'pizarron-fiscal-3d': 0xc96a30,
  'puerta-crecer-3d': 0x7a5599,
  'zona-logistica-3d': 0x3e8e7e,
};

export interface OficinaHandle {
  (): void;
  /** Marca el objeto en la escena (null = limpia). Aditivo: el dispose sigue siendo llamable. */
  resaltar: (id: Objeto3DId | null) => void;
  /** Estado base del objeto según el panel (ticket 03): encendido restaura color,
      fantasma lo vuelve translúcido, apagado lo grisalla. No pisa el brillo propio. */
  marcar: (id: Objeto3DId, estado: EstadoObjeto3D) => void;
}

export function mountEmpresaScene(
  canvas: HTMLCanvasElement,
  onPick: SeleccionCb,
  etiquetas?: HTMLElement,
): OficinaHandle {
  const container = canvas.parentElement ?? canvas;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x171310, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Maquillaje (manual: shadows + color management): una sola direccional
  // proyecta (shadow maps = 1 render extra, no 1 por luz), suavizado PCF y
  // tone mapping fílmico para no quemar blancos.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x171310);
  scene.fog = new THREE.Fog(0x171310, 20, 42);
  // IBL gratis (RoomEnvironment+PMREM, 0KB de red): el uplift PBR sin HDRI.
  // Decidido en el research #156; el build valida environmentIntensity por zona.
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // IBL + luces viejas quemaban (captura 1): el environment manda a media
    // fuerza y las direccionales bajan para compensar.
    scene.environmentIntensity = 0.5;
    pmrem.dispose();
  }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(6.5, 5.5, 8);
  camera.lookAt(0, 0.6, 0);

  // Luz cálida de local: hemisferio suave + una sola direccional con sombra
  // + relleno frío sin sombra. Intensidades retuneadas para IBL (antes quemaba).
  scene.add(new THREE.HemisphereLight(0xfff2e0, 0x2a2018, 0.25));
  const sol = new THREE.DirectionalLight(0xffedd5, 0.9);
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
  const relleno = new THREE.DirectionalLight(0x9db8ff, 0.15);
  relleno.position.set(-6, 4, 6);
  scene.add(relleno);

  // Texturas procedurales (cero assets/red): veta de madera, pantallas con
  // contenido, pizarrón escrito. Se registran en `texturas` y se disponen en
  // dispose() (precedente: nebula-scene dispone su CanvasTexture a mano).
  const texturas: THREE.Texture[] = [];
  function lienzo(w: number, h: number, dibuja: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d')!;
    dibuja(ctx);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    texturas.push(tx);
    return tx;
  }
  function texturaMadera(repX: number, repY: number): THREE.CanvasTexture {
    const tx = lienzo(256, 256, (ctx) => {
      ctx.fillStyle = '#7a5f43';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 46; i++) {
        const y = Math.random() * 256;
        ctx.strokeStyle = `rgba(60, 42, 26, ${0.12 + Math.random() * 0.22})`;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const y = Math.random() * 256;
        ctx.strokeStyle = `rgba(214, 186, 140, ${0.08 + Math.random() * 0.12})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + (Math.random() * 8 - 4));
        ctx.stroke();
      }
    });
    tx.wrapS = THREE.RepeatWrapping;
    tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(repX, repY);
    return tx;
  }
  const texPiso = texturaMadera(3, 2.2);
  const texMueble = texturaMadera(1, 1);
  // Monitor de compras: mini panel admin (cabecera + filas + columna de totales).
  const texPantalla = lienzo(256, 160, (ctx) => {
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#1b3a52';
    ctx.fillRect(0, 0, 256, 26);
    ctx.fillStyle = '#9fd4ff';
    ctx.fillRect(12, 9, 80, 8);
    const filas = ['#2e5a7c', '#35945e', '#2e5a7c', '#c96a30'];
    filas.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(12, 40 + i * 26, 150 - i * 18, 14);
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(170, 40 + i * 26, 74, 14);
    });
  });
  // Registradoras: display de total.
  const texTicket = lienzo(64, 48, (ctx) => {
    ctx.fillStyle = '#0a1410';
    ctx.fillRect(0, 0, 64, 48);
    ctx.fillStyle = '#3ae08a';
    ctx.fillRect(8, 6, 48, 12);
    ctx.fillStyle = '#123524';
    ctx.fillRect(8, 26, 48, 4);
    ctx.fillRect(8, 34, 30, 4);
  });
  // Pizarrón: trazos de tiza (título + líneas + tilde).
  const texPizarron = lienzo(256, 144, (ctx) => {
    ctx.fillStyle = '#e8ddc8';
    ctx.fillRect(0, 0, 256, 144);
    ctx.strokeStyle = 'rgba(90, 100, 115, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 26);
    ctx.lineTo(150, 26);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(20, 52 + i * 20);
      ctx.lineTo(200 - i * 22, 52 + i * 20);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(208, 100);
    ctx.lineTo(222, 116);
    ctx.lineTo(242, 82);
    ctx.stroke();
  });

  // Habitación: piso madera + alfombra + paredes que reciben sombra.
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: texPiso, roughness: 0.75 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

  const alfombra = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x4a3430, roughness: 0.95 }),
  );
  alfombra.rotation.x = -Math.PI / 2;
  alfombra.position.set(-0.4, 0.01, 0.2);
  alfombra.receiveShadow = true;
  scene.add(alfombra);

  const matPared = new THREE.MeshStandardMaterial({ color: 0x2e2721, roughness: 0.95 });
  const paredFondo = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.6), matPared);
  paredFondo.position.set(0, 1.8, -4.5);
  paredFondo.receiveShadow = true;
  scene.add(paredFondo);
  const paredLat = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6), matPared);
  paredLat.rotation.y = Math.PI / 2;
  paredLat.position.set(-6, 1.8, 0);
  paredLat.receiveShadow = true;
  scene.add(paredLat);
  const zocalo = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.12, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.9 }),
  );
  zocalo.position.set(0, 0.06, -4.47);
  scene.add(zocalo);

  // Ventana en pared fondo: vidrio diurno que motiva la luz cálida.
  {
    const marco = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.8 });
    const vg = new THREE.Group();
    const vidrio = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.3),
      new THREE.MeshStandardMaterial({
        color: 0xbfd4e6, emissive: 0x9fc0dd, emissiveIntensity: 0.55, roughness: 0.4,
      }),
    );
    vg.add(vidrio);
    const sup = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.08), marco);
    sup.position.y = 0.7;
    vg.add(sup);
    const inf = sup.clone();
    inf.position.y = -0.7;
    vg.add(inf);
    const izq = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.08), marco);
    izq.position.x = -1.05;
    vg.add(izq);
    const der = izq.clone();
    der.position.x = 1.05;
    vg.add(der);
    const cruzV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.06), marco);
    vg.add(cruzV);
    const cruzH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.06), marco);
    vg.add(cruzH);
    vg.position.set(-2.5, 2.2, -4.46);
    scene.add(vg);
  }

  // Vigas en lo alto de las paredes: insinúan el techo sin tapar la vista
  // cenital (un cielorraso cerraría la escena de muñecas).
  {
    const matViga = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 });
    const vigaFondo = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 0.25), matViga);
    vigaFondo.position.set(0, 3.55, -4.35);
    vigaFondo.castShadow = true;
    scene.add(vigaFondo);
    const vigaLat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 9), matViga);
    vigaLat.position.set(-5.85, 3.55, 0);
    vigaLat.castShadow = true;
    scene.add(vigaLat);
  }

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
    extra?: { emissive?: number; emissiveIntensity?: number; fijo?: boolean; roughness?: number; metalness?: number; map?: THREE.Texture; emissiveMap?: THREE.Texture },
  ) {
    const params: THREE.MeshStandardMaterialParameters = {
      color,
      roughness: extra?.roughness ?? 0.7,
      metalness: extra?.metalness ?? 0.05,
      emissive: extra?.emissive ?? 0x000000,
      emissiveIntensity: extra?.emissiveIntensity ?? 1,
    };
    if (extra?.map) params.map = extra.map;
    if (extra?.emissiveMap) params.emissiveMap = extra.emissiveMap;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial(params));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (extra?.fijo) m.userData.fijo = true; // brillo propio, no lo pisa el highlight
    g.add(m);
    return m;
  }

  // Latas/frascos: cilindros baratos que rompen el look "todo cajas".
  function tarro(
    g: THREE.Group,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    color: number,
    extra?: { roughness?: number; metalness?: number },
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 20),
      new THREE.MeshStandardMaterial({
        color,
        roughness: extra?.roughness ?? 0.5,
        metalness: extra?.metalness ?? 0.3,
      }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
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

  function marcar(id: Objeto3DId, estado: EstadoObjeto3D) {
    const g = raices.find((r) => r.userData.objeto === id);
    if (!g) return;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mesh.userData.color0 === undefined) mesh.userData.color0 = mat.color.getHex();
      if (estado === 'encendido') {
        mat.color.setHex(mesh.userData.color0 as number);
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
      } else if (estado === 'fantasma') {
        mat.color.setHex(mesh.userData.color0 as number);
        mat.transparent = true;
        mat.opacity = 0.25;
        mat.depthWrite = false;
      } else {
        mat.color.setHex(0x8f8f8f);
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
      }
      if (!mesh.userData.fijo) mat.emissive.setHex(0x000000);
    });
    if (reduced) foto();
    else programa();
  }

  // Path GLTF real con cascada a procedural (decisión #157): intenta el GLB
  // del manifest y cae al procedural si falta. En el prototipo el manifest
  // está vacío a propósito: ejercita el catch sin red.
  async function cargarGLBZona(id: Objeto3DId): Promise<boolean> {
    try {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const prueba = new GLTFLoader().path;
      void prueba;
      const res = await fetch(`/models/${id}/v1.glb`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
  void cargarGLBZona('zona-logistica-3d');

  // Mostrador (madera + tapa clara + zócalo + frente con paneles) — frente
  {
    const g = raiz('mostrador-3d');
    const c = COLORES['mostrador-3d'];
    pieza(g, 3.4, 0.12, 0.86, -1.5, 0.06, 2.6, 0x1c1712, { roughness: 0.9 }); // zócalo
    pieza(g, 3.4, 0.82, 0.8, -1.5, 0.53, 2.6, c, { roughness: 0.6 }); // cuerpo
    for (const x of [-2.35, -1.5, -0.65]) {
      pieza(g, 0.7, 0.5, 0.04, x, 0.5, 3.01, 0x2e5a7c, { roughness: 0.55 }); // paneles frente
    }
    pieza(g, 3.6, 0.08, 1.0, -1.5, 0.98, 2.6, 0xffffff, { map: texMueble, roughness: 0.45 }); // tapa madera clara
    for (const x of [-2.2, -0.8]) {
      pieza(g, 0.4, 0.28, 0.4, x, 1.16, 2.6, 0x222831, { roughness: 0.5, metalness: 0.4 }); // registradora
      pieza(g, 0.3, 0.2, 0.04, x, 1.36, 2.45, 0xffffff, { map: texTicket, emissive: 0xffffff, emissiveMap: texTicket, emissiveIntensity: 0.9, fijo: true }); // display total
    }
  }
  // Estantería / depósito — izquierda (laterales + trasera + 4 niveles con mercadería mixta)
  {
    const g = raiz('estanteria-3d');
    const c = COLORES['estanteria-3d'];
    for (const y of [0.3, 1.0, 1.7, 2.4]) pieza(g, 0.6, 0.07, 3.2, -4.6, y, -0.5, 0xffffff, { map: texMueble, roughness: 0.65 });
    for (const z of [-2.06, 1.06]) pieza(g, 0.6, 2.6, 0.08, -4.6, 1.3, z, c, { roughness: 0.65 });
    pieza(g, 0.06, 2.6, 3.2, -4.88, 1.3, -0.5, 0x6e4a22, { roughness: 0.8 }); // trasera
    const merc = [0xd9c9a8, 0xb7c4c9, 0xc9a8b7];
    [0.52, 1.22, 1.92, 2.62].forEach((y, i) => {
      pieza(g, 0.4, 0.3, 0.5, -4.6, y, -1.3, merc[i % 3], { roughness: 0.8 });
      tarro(g, 0.14, 0.34, -4.6, y + 0.02, 0.3, merc[(i + 1) % 3]);
      tarro(g, 0.11, 0.26, -4.6, y - 0.02, 0.75, merc[(i + 2) % 3]);
    });
  }
  // Góndola / ventas — centro (base + postes + dos niveles con mercadería + cartel)
  {
    const g = raiz('gondola-3d');
    const c = COLORES['gondola-3d'];
    pieza(g, 1.0, 0.9, 2.4, 0.2, 0.45, -0.3, c, { roughness: 0.6 });
    for (const z of [-1.4, 0.8]) {
      pieza(g, 0.08, 1.0, 0.08, -0.2, 1.35, z, 0x8f8f8f, { roughness: 0.4, metalness: 0.6 });
      pieza(g, 0.08, 1.0, 0.08, 0.6, 1.35, z, 0x8f8f8f, { roughness: 0.4, metalness: 0.6 });
    }
    pieza(g, 0.9, 0.06, 2.2, 0.2, 0.95, -0.3, 0x35945e, { roughness: 0.55 });
    pieza(g, 0.9, 0.06, 2.2, 0.2, 1.5, -0.3, 0x35945e, { roughness: 0.55 });
    for (const [y, zc] of [[1.1, -0.9], [1.1, 0.3], [1.65, -0.7], [1.65, 0.5]] as const) {
      pieza(g, 0.5, 0.22, 0.4, 0.2, y, zc, 0xd9c9a8, { roughness: 0.8 });
    }
    tarro(g, 0.12, 0.3, 0.2, 1.12, -0.1, 0xb7c4c9);
    pieza(g, 0.98, 0.26, 0.54, 0.2, 1.85, -0.3, 0x2b7a4b, { roughness: 0.6 }); // cartel
    pieza(g, 0.9, 0.18, 0.02, 0.2, 1.85, -0.02, 0xe8ddc8, { roughness: 0.7 }); // frente cartel
  }
  // Computadora / compras — derecha (mesa con patas + monitor + silla)
  {
    const g = raiz('computadora-3d');
    const c = COLORES['computadora-3d'];
    pieza(g, 1.8, 0.08, 0.9, 3.4, 0.75, 1.4, 0x6b5f4c, { roughness: 0.55 }); // tapa mesa madera
    for (const [x, z] of [[2.6, 1.05], [4.2, 1.05], [2.6, 1.75], [4.2, 1.75]] as const) {
      pieza(g, 0.08, 0.75, 0.08, x, 0.37, z, c, { roughness: 0.5, metalness: 0.3 });
    }
    pieza(g, 0.3, 0.06, 0.24, 3.4, 0.82, 1.1, 0x222831, { roughness: 0.5 }); // base monitor
    pieza(g, 0.08, 0.35, 0.08, 3.4, 1.0, 1.1, 0x222831, { roughness: 0.5 }); // pie
    pieza(g, 1.1, 0.7, 0.06, 3.4, 1.45, 1.1, 0x222831, { roughness: 0.5 }); // marco monitor
    pieza(g, 0.95, 0.55, 0.065, 3.4, 1.45, 1.1, 0xffffff, { map: texPantalla, emissive: 0xffffff, emissiveMap: texPantalla, emissiveIntensity: 0.9, fijo: true }); // panel admin
    pieza(g, 0.7, 0.05, 0.25, 3.4, 0.82, 1.7, 0x222831, { roughness: 0.6 }); // teclado
    // Silla: asiento + respaldo + poste + base estrella simple
    pieza(g, 0.55, 0.08, 0.55, 3.4, 0.5, 2.5, 0x3a3f4a, { roughness: 0.7 });
    pieza(g, 0.55, 0.6, 0.08, 3.4, 0.85, 2.75, 0x3a3f4a, { roughness: 0.7 });
    pieza(g, 0.07, 0.45, 0.07, 3.4, 0.25, 2.5, 0x222831, { roughness: 0.4, metalness: 0.6 });
    pieza(g, 0.6, 0.05, 0.6, 3.4, 0.03, 2.5, 0x222831, { roughness: 0.4, metalness: 0.6 });
  }
  // Pizarrón fiscal — fondo (marco madera + superficie + bandeja + patas)
  {
    const g = raiz('pizarron-fiscal-3d');
    pieza(g, 2.5, 1.5, 0.08, 0.5, 2.0, -3.6, 0x6e4a22, { roughness: 0.6 }); // marco
    pieza(g, 2.3, 1.3, 0.09, 0.5, 2.0, -3.6, 0xffffff, { map: texPizarron, roughness: 0.85 }); // superficie escrita
    pieza(g, 2.3, 0.05, 0.15, 0.5, 1.28, -3.55, 0x6e4a22, { roughness: 0.6 }); // bandeja
    pieza(g, 0.18, 0.04, 0.04, 0.0, 1.32, -3.5, 0x2b4a6b, { roughness: 0.5 }); // marcador
    pieza(g, 0.18, 0.04, 0.04, 0.35, 1.32, -3.5, 0xc23b3b, { roughness: 0.5 }); // marcador
    for (const x of [-0.4, 1.4]) pieza(g, 0.1, 1.3, 0.1, x, 0.65, -3.6, 0x4a4a4a, { roughness: 0.5, metalness: 0.4 });
  }
  // Puerta "crecer" — fondo derecha (marco + hoja con paneles + picaporte + escalón)
  {
    const g = raiz('puerta-crecer-3d');
    const c = COLORES['puerta-crecer-3d'];
    pieza(g, 1.5, 2.6, 0.12, 3.8, 1.3, -3.6, 0x3a2a52, { roughness: 0.7 }); // marco
    pieza(g, 1.2, 2.4, 0.14, 3.8, 1.2, -3.6, c, { roughness: 0.55 }); // hoja
    pieza(g, 0.9, 0.7, 0.03, 3.8, 1.75, -3.52, 0x8a68ad, { roughness: 0.5 }); // panel sup
    pieza(g, 0.9, 0.7, 0.03, 3.8, 0.85, -3.52, 0x8a68ad, { roughness: 0.5 }); // panel inf
    pieza(g, 0.12, 0.12, 0.2, 3.35, 1.2, -3.55, 0xd9c9a8, { emissive: 0x554411, fijo: true }); // picaporte
    pieza(g, 1.6, 0.08, 0.5, 3.8, 0.04, -3.3, 0x241b36, { roughness: 0.9 }); // escalón
  }
  // Zona logística — dársena derecha (rack con niveles + pallet + furgón).
  // Procedural a propósito: el GLB real llega en el build (ver loadEmpresaGLB).
  {
    const g = raiz('zona-logistica-3d');
    const c = COLORES['zona-logistica-3d'];
    // Rack: 4 parantes + 2 estantes con cajas
    for (const [x, z] of [[4.7, -2.2], [5.6, -2.2], [4.7, -0.8], [5.6, -0.8]] as const) {
      pieza(g, 0.09, 2.2, 0.09, x, 1.1, z, 0x8f8f8f, { roughness: 0.4, metalness: 0.6 });
    }
    for (const y of [0.5, 1.3, 2.05]) pieza(g, 1.0, 0.07, 1.5, 5.15, y, -1.5, c, { roughness: 0.55 });
    pieza(g, 0.55, 0.4, 0.6, 5.0, 0.73, -1.7, 0xd9c9a8, { roughness: 0.8 });
    pieza(g, 0.55, 0.4, 0.6, 5.35, 0.73, -1.2, 0xb7c4c9, { roughness: 0.8 });
    pieza(g, 0.55, 0.4, 0.6, 5.15, 1.53, -1.5, 0xc9a8b7, { roughness: 0.8 });
    tarro(g, 0.13, 0.32, 5.0, 1.5, -1.1, 0xd9c9a8);
    // Pallet con cajas apiladas
    pieza(g, 1.0, 0.12, 0.8, 4.1, 0.06, -0.2, 0x6e4a22, { roughness: 0.8 }); // tarima
    pieza(g, 0.7, 0.5, 0.6, 4.1, 0.37, -0.2, 0xd9c9a8, { roughness: 0.8 });
    pieza(g, 0.5, 0.35, 0.45, 4.1, 0.8, -0.2, 0xb7c4c9, { roughness: 0.8 });
    // Furgón: caja + cabina + ruedas (cajas, prototipo)
    pieza(g, 1.5, 0.9, 0.8, 4.3, 0.75, -3.0, 0xe8e4da, { roughness: 0.5 }); // caja
    pieza(g, 0.5, 0.55, 0.78, 3.35, 0.57, -3.0, 0x2e5a7c, { roughness: 0.5 }); // cabina
    for (const [x, z] of [[3.9, -2.6], [4.8, -2.6], [3.9, -3.4], [4.8, -3.4]] as const) {
      pieza(g, 0.22, 0.22, 0.12, x, 0.11, z, 0x1c1c1e, { roughness: 0.9 });
    }
    pieza(g, 1.6, 0.06, 0.9, 4.3, 0.03, -3.0, 0x241b36, { roughness: 0.9 }); // sombra dársena
  }

  // Lámpara colgante: foco cálido del local (fuera de raices: no clicable,
  // no la toca marcar/resaltar; sin sombras para no ensuciar el shadow map).
  {
    const lampara = new THREE.Group();
    const cordon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.9 }),
    );
    cordon.position.y = 1.15;
    lampara.add(cordon);
    const pantalla = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 0.3, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8a4a2b, roughness: 0.6, side: THREE.DoubleSide }),
    );
    pantalla.position.y = 0;
    lampara.add(pantalla);
    const foco = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffe6b8, emissive: 0xffc46b, emissiveIntensity: 2.2, roughness: 0.4,
      }),
    );
    foco.position.y = -0.12;
    lampara.add(foco);
    lampara.position.set(0.5, 2.5, 0.5);
    lampara.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    scene.add(lampara);
  }

  // Carteles HTML alineados a 3D (manual: align-html-elements-to-3d):
  // texto real (seleccionable, con CSS) proyectado cada frame.
  const ANCLAS: Record<Objeto3DId, [number, number, number]> = {
    'mostrador-3d': [-1.5, 2.0, 2.6],
    'estanteria-3d': [-4.6, 3.0, -0.5],
    'gondola-3d': [-0.1, 2.35, -0.3],
    'computadora-3d': [3.4, 1.8, 1.4],
    'pizarron-fiscal-3d': [-0.4, 3.0, -3.6],
    'puerta-crecer-3d': [3.6, 3.15, -3.6],
    'zona-logistica-3d': [5.0, 2.7, -1.8],
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
      // Clamp horizontal: la píldora (~168px la más ancha) nunca se recorta
      // en móvil; en desktop es no-op (todo cae dentro).
      const xc = Math.min(Math.max(x, 84), Math.max(w - 84, 84));
      div.style.transform = `translate(-50%, -100%) translate(${xc.toFixed(1)}px, ${y.toFixed(1)}px)`;
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
    for (const t of texturas) t.dispose();
    delete canvas.dataset.mounted;
  }
  return Object.assign(dispose, { resaltar, marcar });
}
