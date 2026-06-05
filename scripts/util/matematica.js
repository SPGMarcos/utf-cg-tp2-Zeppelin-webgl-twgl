/*
  Funcoes matematicas auxiliares.
  Este modulo concentra operacoes usadas em movimento, interpolacao,
  transformacoes de objetos e geracao deterministica de valores aleatorios.
*/
export function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

export function misturar(a, b, t) {
  return a + (b - a) * t;
}

// Aproxima um valor do alvo de forma suave e independente da taxa de frames.
export function suavizarAtual(valor, alvo, rigidez, dt) {
  const t = 1 - Math.exp(-rigidez * dt);
  return misturar(valor, alvo, t);
}

export function comprimento(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

export function normalizar(v) {
  const l = comprimento(v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export function subtrair(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function somar(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function escalar(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

// Gera numeros pseudoaleatorios repetiveis a partir de uma semente.
export function pseudoAleatorio(seed) {
  let estado = seed >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

// Cria uma matriz de transformacao com posicao, rotacao e escala.
export function criarTransformacao({ posicao = [0, 0, 0], rotacao = [0, 0, 0], escala = [1, 1, 1] } = {}) {
  const m4 = twgl.m4;
  let m = m4.identity();
  m = m4.translate(m, posicao);
  m = m4.rotateY(m, rotacao[1]);
  m = m4.rotateX(m, rotacao[0]);
  m = m4.rotateZ(m, rotacao[2]);
  m = m4.scale(m, escala);
  return m;
}

export function multiplicarTransformacao(pai, local) {
  return twgl.m4.multiply(pai, local);
}
