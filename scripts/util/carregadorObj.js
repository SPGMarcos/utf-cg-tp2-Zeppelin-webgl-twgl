/*
  Carregador simples de arquivos OBJ.
  Este modulo transforma o texto de um modelo OBJ em arrays de vertices,
  normais, coordenadas de textura e indices prontos para o TWGL/WebGL.
*/
export function carregarOBJ(texto) {
  // O OBJ separa indices de posicao, textura e normal; aqui eles viram um vertice unico.
  const posicoes = [[0, 0, 0]];
  const uvs = [[0, 0]];
  const normais = [[0, 1, 0]];
  const saida = { position: [], normal: [], texcoord: [], tangent: [], indices: [] };
  const mapa = new Map();

  function vertice(chave) {
    if (mapa.has(chave)) return mapa.get(chave);
    const [pi, ti, ni] = chave.split("/").map((v) => Number(v || 0));
    const indice = saida.position.length / 3;
    saida.position.push(...posicoes[pi]);
    saida.texcoord.push(...(uvs[ti] || [0, 0]));
    saida.normal.push(...(normais[ni] || [0, 1, 0]));
    saida.tangent.push(1, 0, 0);
    mapa.set(chave, indice);
    return indice;
  }

  for (const linha of texto.split(/\r?\n/)) {
    const partes = linha.trim().split(/\s+/);
    if (partes[0] === "v") posicoes.push(partes.slice(1, 4).map(Number));
    if (partes[0] === "vt") uvs.push(partes.slice(1, 3).map(Number));
    if (partes[0] === "vn") normais.push(partes.slice(1, 4).map(Number));
    if (partes[0] === "f") {
      const ids = partes.slice(1).map(vertice);
      // Divide faces com mais de tres vertices em triangulos.
      for (let i = 1; i < ids.length - 1; i++) saida.indices.push(ids[0], ids[i], ids[i + 1]);
    }
  }

  return {
    position: { numComponents: 3, data: saida.position },
    normal: { numComponents: 3, data: saida.normal },
    texcoord: { numComponents: 2, data: saida.texcoord },
    tangent: { numComponents: 3, data: saida.tangent },
    indices: saida.indices,
  };
}
