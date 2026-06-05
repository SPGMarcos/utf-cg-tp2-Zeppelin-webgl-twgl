/*
  Definicao dos materiais da simulacao.
  Este modulo associa cores, texturas, brilho, transparencia e emissivos aos
  nomes de materiais usados pelos objetos da cidade e do navio.
*/
export function criarMateriais(texturas) {
  // Centraliza os materiais para facilitar ajustes no estilo visual.
  return {
    chao: { cor: [0.50, 0.66, 0.46, 1], textura: texturas.gramaLowPoly, shininess: 8, especular: 0.03 },
    gramaUrbana: { cor: [0.48, 0.62, 0.44, 1], textura: texturas.gramaLowPoly, shininess: 7, especular: 0.02 },
    ruaKit: { cor: [0.11, 0.125, 0.145, 1], textura: texturas.branco, shininess: 72, especular: 0.04 },
    faixaRua: { cor: [1.0, 0.74, 0.18, 1], textura: texturas.branco, shininess: 20, especular: 0.08 },
    predioKit: { cor: [0.56, 0.64, 0.75, 1], textura: texturas.predio, shininess: 64, emissivoDia: [0.006, 0.008, 0.012] },
    industrialKit: { cor: [0.48, 0.50, 0.52, 1], textura: texturas.metal, shininess: 46 },
    carroKit: { cor: [0.72, 0.18, 0.14, 1], textura: texturas.branco, shininess: 80 },
    carroAzul: { cor: [0.12, 0.38, 0.86, 1], textura: texturas.branco, shininess: 82 },
    carroAmarelo: { cor: [0.95, 0.72, 0.12, 1], textura: texturas.branco, shininess: 76 },
    carroVerde: { cor: [0.12, 0.62, 0.38, 1], textura: texturas.branco, shininess: 74 },
    carroBranco: { cor: [0.86, 0.9, 0.92, 1], textura: texturas.branco, shininess: 86 },
    carroRoxo: { cor: [0.45, 0.18, 0.78, 1], textura: texturas.branco, shininess: 80 },
    carroLaranja: { cor: [0.95, 0.42, 0.12, 1], textura: texturas.branco, shininess: 78 },
    carroCiano: { cor: [0.08, 0.78, 0.84, 1], textura: texturas.branco, shininess: 82 },
    concreto: { cor: [0.45, 0.48, 0.52, 1], textura: texturas.branco, shininess: 20 },
    calcada: { cor: [0.56, 0.59, 0.60, 1], textura: texturas.branco, shininess: 16, especular: 0.08 },
    vidro: { cor: [0.62, 0.92, 1.0, 0.32], textura: texturas.branco, shininess: 128, alpha: 0.36, emissivoDia: [0.01, 0.03, 0.04] },
    luzQuente: { cor: [1.0, 0.62, 0.22, 1], textura: texturas.branco, shininess: 90, emissivoDia: [0.04, 0.025, 0.008], pulso: 1.2 },
    couro: { cor: [0.34, 0.17, 0.08, 1], textura: texturas.metal, shininess: 26 },
    cobre: { cor: [0.95, 0.58, 0.25, 1], textura: texturas.metal, normalMap: texturas.normalOndulada, usarNormalMap: 1, shininess: 68 },
    metalEscuro: { cor: [0.22, 0.23, 0.26, 1], textura: texturas.branco, shininess: 70 },
    madeira: { cor: [0.48, 0.28, 0.14, 1], textura: texturas.branco, shininess: 10 },
    folhaNature: { cor: [0.06, 0.34, 0.14, 1], textura: texturas.branco, shininess: 10 },
    folhaBaixa: { cor: [0.18, 0.50, 0.24, 1], textura: texturas.branco, shininess: 8 },
    rochaNature: { cor: [0.42, 0.44, 0.43, 1], textura: texturas.branco, shininess: 16 },
    sombra: { cor: [0.02, 0.015, 0.01, 0.35], textura: texturas.branco, shininess: 1, alpha: 0.35 },
    heliporto: { cor: [0.86, 0.88, 0.94, 1], textura: texturas.heliporto, shininess: 42, emissivoDia: [0.01, 0.008, 0.003] },
  };
}
