/*
  Geracao de geometrias primitivas.
  Este modulo cria plano, cubo, cilindro e esfera diretamente em arrays,
  permitindo montar partes simples da cena sem depender de modelos externos.
*/
function empurrarVertice(arrays, p, n, uv, t = [1, 0, 0]) {
  arrays.position.push(...p);
  arrays.normal.push(...n);
  arrays.texcoord.push(...uv);
  arrays.tangent.push(...t);
}

function finalizar(arrays) {
  return {
    position: { numComponents: 3, data: arrays.position },
    normal: { numComponents: 3, data: arrays.normal },
    texcoord: { numComponents: 2, data: arrays.texcoord },
    tangent: { numComponents: 3, data: arrays.tangent },
    indices: arrays.indices,
  };
}

export function criarPlano(tamanho = 1, repeticao = 1) {
  // Cria um plano horizontal usado como base para chao e superficies simples.
  const t = tamanho / 2;
  const arrays = { position: [], normal: [], texcoord: [], tangent: [], indices: [] };
  empurrarVertice(arrays, [-t, 0, -t], [0, 1, 0], [0, 0]);
  empurrarVertice(arrays, [t, 0, -t], [0, 1, 0], [repeticao, 0]);
  empurrarVertice(arrays, [t, 0, t], [0, 1, 0], [repeticao, repeticao]);
  empurrarVertice(arrays, [-t, 0, t], [0, 1, 0], [0, repeticao]);
  arrays.indices.push(0, 2, 1, 0, 3, 2);
  return finalizar(arrays);
}

// Cria um cubo com normais e UVs separados por face.
export function criarCubo() {
  const arrays = { position: [], normal: [], texcoord: [], tangent: [], indices: [] };
  const faces = [
    { n: [0, 0, 1], t: [1, 0, 0], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], t: [-1, 0, 0], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], t: [0, 0, -1], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], t: [0, 0, 1], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], t: [1, 0, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], t: [1, 0, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  for (const face of faces) {
    const base = arrays.position.length / 3;
    empurrarVertice(arrays, face.v[0], face.n, [0, 0], face.t);
    empurrarVertice(arrays, face.v[1], face.n, [1, 0], face.t);
    empurrarVertice(arrays, face.v[2], face.n, [1, 1], face.t);
    empurrarVertice(arrays, face.v[3], face.n, [0, 1], face.t);
    arrays.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return finalizar(arrays);
}

// Cria um cilindro segmentado, usado em detalhes como troncos e pecas do navio.
export function criarCilindro(segmentos = 24, tampas = true) {
  const arrays = { position: [], normal: [], texcoord: [], tangent: [], indices: [] };
  for (let i = 0; i <= segmentos; i++) {
    const u = i / segmentos;
    const a = u * Math.PI * 2;
    const x = Math.cos(a) * 0.5;
    const z = Math.sin(a) * 0.5;
    const n = [Math.cos(a), 0, Math.sin(a)];
    const tan = [-Math.sin(a), 0, Math.cos(a)];
    empurrarVertice(arrays, [x, -0.5, z], n, [u, 0], tan);
    empurrarVertice(arrays, [x, 0.5, z], n, [u, 1], tan);
  }
  for (let i = 0; i < segmentos; i++) {
    const b = i * 2;
    arrays.indices.push(b, b + 1, b + 3, b, b + 3, b + 2);
  }
  if (tampas) {
    for (const topo of [-0.5, 0.5]) {
      const centro = arrays.position.length / 3;
      empurrarVertice(arrays, [0, topo, 0], [0, Math.sign(topo), 0], [0.5, 0.5]);
      for (let i = 0; i <= segmentos; i++) {
        const a = (i / segmentos) * Math.PI * 2;
        const x = Math.cos(a) * 0.5;
        const z = Math.sin(a) * 0.5;
        empurrarVertice(arrays, [x, topo, z], [0, Math.sign(topo), 0], [x + 0.5, z + 0.5]);
      }
      for (let i = 0; i < segmentos; i++) {
        if (topo > 0) arrays.indices.push(centro, centro + i + 1, centro + i + 2);
        else arrays.indices.push(centro, centro + i + 2, centro + i + 1);
      }
    }
  }
  return finalizar(arrays);
}

// Cria uma esfera parametrica usada em sombras, luzes e volumes arredondados.
export function criarEsfera(latitudes = 16, longitudes = 32) {
  const arrays = { position: [], normal: [], texcoord: [], tangent: [], indices: [] };
  for (let y = 0; y <= latitudes; y++) {
    const v = y / latitudes;
    const phi = v * Math.PI;
    for (let x = 0; x <= longitudes; x++) {
      const u = x / longitudes;
      const theta = u * Math.PI * 2;
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);
      empurrarVertice(arrays, [nx * 0.5, ny * 0.5, nz * 0.5], [nx, ny, nz], [u, v], [-Math.sin(theta), 0, Math.cos(theta)]);
    }
  }
  for (let y = 0; y < latitudes; y++) {
    for (let x = 0; x < longitudes; x++) {
      const a = y * (longitudes + 1) + x;
      const b = a + longitudes + 1;
      arrays.indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return finalizar(arrays);
}
