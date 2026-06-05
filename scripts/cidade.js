import { criarTransformacao, pseudoAleatorio } from "./util/matematica.js";

function objeto(geometria, material, matriz, posicaoReferencia = [0, 0, 0], extra = {}) {
  return { geometria, material, matriz, posicaoReferencia, ...extra };
}

const HELIPORTOS_SECUNDARIOS = new Map([
  ["1,-1", "kit_skyscraper_a"],
  ["1,-3", "kit_skyscraper_a"],
  ["-1,3", "kit_skyscraper_a"],
]);
const CENTRO_DENSO = new Set(["-1,-1", "-1,1", "1,-1", "1,1"]);
const ESPACAMENTO_RUA = 13.5;
const EIXOS_RUAS = [-2, -1, 0, 1, 2].map((indice) => indice * ESPACAMENTO_RUA);
const LIMITE_TERRENO = 54;
const LIMITE_RUA = 54;
const LIMITE_CARRO = 53.8;
const CICLO_CARRO = LIMITE_CARRO * 2;
const AREA_VERDE_ZEPELLINPORTO = { minX: -54, maxX: -4.5, minZ: -54, maxZ: -6.5 };
const AREA_FAIXAS_REMOVIDAS_BASE_INDUSTRIAL = { minX: 4.5, maxX: 36.5, minZ: 42, maxZ: 54 };
const AREAS_CORTE_RUA = [
  AREA_VERDE_ZEPELLINPORTO,
  { minX: 4.5, maxX: 54, minZ: 6.5, maxZ: 54 },
];

function coordenadaLote(indice) {
  return (indice + (indice < 0 ? 0.5 : -0.5)) * ESPACAMENTO_RUA;
}

export class Cidade {
  constructor() {
    this.objetosFixos = [];
    this.carros = [];
    this.postes = [];
    this.colisores = [];
    this.heliportos = [];
    this.areasConcreto = [];
    this.arvoresPosicionadas = [];
    this.tempo = 0;
    this.zepellinPorto = null;
    this.hangarPrincipal = null;
    this.construir();
  }

  construir() {
    this.criarBase();
    this.criarRuasLowPoly();
    this.criarQuarteiroesLowPoly();
    this.criarZepellinPorto();
    this.criarBaseIndustrial();
    this.criarDecoracoesLowPoly();
  }

  criarBase() {
    this.objetosFixos.push(objeto("plano", "chao", criarTransformacao({ posicao: [0, -0.02, 0], escala: [108, 1, 108] }), [0, 0, 0]));
  }

  criarRuasLowPoly() {
    for (let i = -2; i <= 2; i++) {
      this.criarTrechosRua(i * ESPACAMENTO_RUA, 0, "z");
      this.criarTrechosRua(0, i * ESPACAMENTO_RUA, "x");
      this.criarCalcadasDaRua(i * ESPACAMENTO_RUA, 0, "z");
      this.criarCalcadasDaRua(0, i * ESPACAMENTO_RUA, "x");

      for (let j = -2; j <= 2; j++) {
        const cruzamentoX = i * ESPACAMENTO_RUA;
        const cruzamentoZ = j * ESPACAMENTO_RUA;
        if (!this.posicaoEmAreaCorteRua(cruzamentoX, cruzamentoZ)) {
          this.objetosFixos.push(objeto("kit_road_cross_line", "ruaKit", criarTransformacao({ posicao: [cruzamentoX, 0.04, cruzamentoZ], escala: [3.2, 1, 3.2] }), [cruzamentoX, 0, cruzamentoZ]));
        }
        if ((i + j) % 2 === 0 && !this.posicaoEmAreaCorteRua(cruzamentoX + 4.35, cruzamentoZ + 4.35)) this.criarPosteLowPoly(cruzamentoX + 4.35, cruzamentoZ + 4.35, Math.PI * 0.25);
      }
    }

    this.criarFaixasPontilhadas();
  }

  criarTrechosRua(x, z, eixo) {
    for (const [inicio, fim] of this.segmentosRuaForaAreaVerde(x, z, eixo)) {
      const centro = (inicio + fim) * 0.5;
      const comprimento = fim - inicio;
      if (comprimento < 1) continue;
      if (eixo === "z") {
        this.objetosFixos.push(objeto("kit_road_straight", "ruaKit", criarTransformacao({ posicao: [x, 0.02, centro], escala: [3.15, 1, comprimento] }), [x, 0, centro]));
      }
      else {
        this.objetosFixos.push(objeto("kit_road_straight", "ruaKit", criarTransformacao({ posicao: [centro, 0.025, z], rotacao: [0, Math.PI / 2, 0], escala: [3.15, 1, comprimento] }), [centro, 0, z]));
      }
    }
  }

  segmentosRuaForaAreaVerde(x, z, eixo) {
    let segmentos = [[-LIMITE_RUA, LIMITE_RUA]];
    for (const area of AREAS_CORTE_RUA) {
      const dentroDaFaixaCortada = eixo === "z"
        ? x > area.minX && x < area.maxX
        : z > area.minZ && z < area.maxZ;
      if (!dentroDaFaixaCortada) continue;

      const corteInicio = eixo === "z" ? area.minZ : area.minX;
      const corteFim = eixo === "z" ? area.maxZ : area.maxX;
      segmentos = segmentos.flatMap(([inicio, fim]) => [
        [inicio, Math.max(inicio, corteInicio)],
        [Math.min(fim, corteFim), fim],
      ]).filter(([inicio, fim]) => fim - inicio > 1);
    }
    return segmentos;
  }

  criarCalcadasDaRua(x, z, eixo) {
    const afastamento = 2.05;
    const largura = 0.9;
    const y = 0.075;
    const segmentosSemCruzamentos = this.segmentosSemCruzamentos(this.segmentosRuaForaAreaVerde(x, z, eixo));
    for (const [inicio, fim] of segmentosSemCruzamentos) {
      const centro = (inicio + fim) * 0.5;
      const comprimento = fim - inicio;
      if (comprimento < 1) continue;
      const escalas = eixo === "z"
        ? [[largura, 0.05, comprimento], [largura, 0.05, comprimento]]
        : [[comprimento, 0.05, largura], [comprimento, 0.05, largura]];
      const posicoes = eixo === "z"
        ? [[x - afastamento, y, centro], [x + afastamento, y, centro]]
        : [[centro, y, z - afastamento], [centro, y, z + afastamento]];

      for (let i = 0; i < 2; i++) {
        this.objetosFixos.push(objeto("cubo", "calcada", criarTransformacao({
          posicao: posicoes[i],
          escala: escalas[i],
        }), posicoes[i]));
      }
    }
  }

  segmentosSemCruzamentos(segmentos) {
    const margemCruzamento = 2.45;
    let resultado = segmentos;
    for (const eixo of EIXOS_RUAS) {
      resultado = resultado.flatMap(([inicio, fim]) => {
        const corteInicio = eixo - margemCruzamento;
        const corteFim = eixo + margemCruzamento;
        if (corteFim <= inicio || corteInicio >= fim) return [[inicio, fim]];
        return [
          [inicio, Math.max(inicio, corteInicio)],
          [Math.min(fim, corteFim), fim],
        ].filter(([a, b]) => b - a > 1);
      });
    }
    return resultado;
  }

  criarFaixasPontilhadas() {
    const inicio = -53.25;
    const fim = 53.25;
    const passo = 4.2;
    const pontos = [];
    for (let p = inicio; p <= fim; p += passo) pontos.push(p);
    if (fim - pontos[pontos.length - 1] > 1.4) pontos.push(fim);

    for (const eixo of EIXOS_RUAS) {
      for (const p of pontos) {
        if (EIXOS_RUAS.some((cruzamento) => Math.abs(p - cruzamento) < 2.25)) continue;
        if (!this.posicaoEmAreaCorteRua(eixo, p) && !this.posicaoEmAreaFaixaRemovidaBaseIndustrial(eixo, p)) {
          this.objetosFixos.push(objeto("cubo", "faixaRua", criarTransformacao({
            posicao: [eixo, 0.115, p],
            escala: [0.16, 0.025, 1.55],
          }), [eixo, 0.12, p]));
        }
        if (!this.posicaoEmAreaCorteRua(p, eixo) && !this.posicaoEmAreaFaixaRemovidaBaseIndustrial(p, eixo)) {
          this.objetosFixos.push(objeto("cubo", "faixaRua", criarTransformacao({
            posicao: [p, 0.12, eixo],
            escala: [1.55, 0.025, 0.16],
          }), [p, 0.12, eixo]));
        }
      }
    }
  }

  criarQuarteiroesLowPoly() {
    const rnd = pseudoAleatorio(47112);
    const lotesBloqueados = new Set(["-3,-2", "-3,-3", "-2,-2", "2,1", "2,2", "3,1", "3,2"]);
    const lotesLeves = new Set(["-2,-3", "-2,-1", "-3,-1", "1,1", "1,2", "2,3", "3,3"]);
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (Math.abs(gx) < 1 && Math.abs(gz) < 1) continue;
        if (gx === 0 || gz === 0) continue;
        const chave = `${gx},${gz}`;
        if (lotesBloqueados.has(chave)) continue;

        // Os centros ficam no meio das quadras entre as ruas do kit; o jitter pequeno evita invadir corredores.
        const loteCentral = CENTRO_DENSO.has(chave);
        const jitter = loteCentral || lotesLeves.has(chave) ? 0.18 : 0.38;
        const x = coordenadaLote(gx) + (rnd() - 0.5) * jitter;
        const z = coordenadaLote(gz) + (rnd() - 0.5) * jitter;
        const ehHeliportoFixo = HELIPORTOS_SECUNDARIOS.has(chave);
        if (loteCentral || ehHeliportoFixo || (!lotesLeves.has(chave) && rnd() < 0.72)) this.criarPredioLowPoly(x, z, rnd, gx, gz);
        else this.criarLoteLowPoly(x, z, rnd);
      }
    }
  }

  registrarColisor(nome, x, y, z, sx, sy, sz, extra = {}) {
    this.colisores.push({
      nome,
      min: [x - sx * 0.5, y - sy * 0.5, z - sz * 0.5],
      max: [x + sx * 0.5, y + sy * 0.5, z + sz * 0.5],
      ...extra,
    });
  }

  criarBaseConcreto(x, z, sx, sz, rotacao = 0) {
    const c = Math.abs(Math.cos(rotacao));
    const s = Math.abs(Math.sin(rotacao));
    const larguraX = sx * c + sz * s;
    const larguraZ = sx * s + sz * c;
    this.areasConcreto.push({
      minX: x - larguraX * 0.5,
      maxX: x + larguraX * 0.5,
      minZ: z - larguraZ * 0.5,
      maxZ: z + larguraZ * 0.5,
    });
    this.objetosFixos.push(objeto("cubo", "concreto", criarTransformacao({
      posicao: [x, 0.0, z],
      rotacao: [0, rotacao, 0],
      escala: [sx, 0.04, sz],
    }), [x, 0, z]));
  }

  criarBaseGrama(x, z, sx, sz, rotacao = 0) {
    this.objetosFixos.push(objeto("cubo", "gramaUrbana", criarTransformacao({
      posicao: [x, -0.01, z],
      rotacao: [0, rotacao, 0],
      escala: [sx, 0.035, sz],
    }), [x, 0, z]));
    return true;
  }

  criarPredioLowPoly(x, z, rnd, gx = 0, gz = 0) {
    const heliportoFixo = HELIPORTOS_SECUNDARIOS.get(`${gx},${gz}`);
    const opcoes = [
      { geo: "kit_building_a", altura: 7.2, escala: [5.0, 5.6, 5.0], dims: [0.88, 1.29, 0.94] },
      { geo: "kit_building_b", altura: 7.2, escala: [4.8, 5.6, 5.0], dims: [0.97, 1.29, 0.94] },
      { geo: "kit_building_e", altura: 8.8, escala: [4.2, 9.9, 5.2], dims: [1.64, 0.89, 1.01] },
      { geo: "kit_building_h", altura: 7.2, escala: [5.0, 5.6, 5.0], dims: [0.88, 1.29, 1.01] },
      { geo: "kit_building_k", altura: 10.5, escala: [3.7, 7.15, 5.6], dims: [2.08, 1.47, 0.94] },
      { geo: "kit_building_l", altura: 14.8, escala: [4.6, 6.52, 4.6], dims: [1.37, 2.27, 1.4], heliporto: true },
      { geo: "kit_building_m", altura: 17.0, escala: [4.4, 5.4, 4.4], dims: [1.24, 3.15, 1.24], heliporto: true },
      { geo: "kit_low_building_h", altura: 6.0, escala: [7.2, 2.85, 7.2], dims: [0.5, 2.1, 0.5] },
      { geo: "kit_low_building_wide", altura: 6.4, escala: [7.6, 5.8, 7.6], dims: [1.0, 1.1, 0.5] },
      { geo: "kit_skyscraper_a", altura: 18.5, escala: [5.4, 6.42, 5.4], dims: [1.36, 2.88, 1.36], heliporto: true },
      { geo: "kit_skyscraper_c", altura: 21.0, escala: [5.2, 5.15, 5.2], dims: [1.28, 4.08, 1.39] },
    ];
    const tipo = heliportoFixo ? opcoes.find((opcao) => opcao.geo === heliportoFixo) : opcoes[Math.floor(rnd() * opcoes.length)];
    const rotacao = Math.floor(rnd() * 4) * Math.PI / 2;
    const larguraX = tipo.dims[0] * tipo.escala[0];
    const larguraZ = tipo.dims[2] * tipo.escala[2];
    const colisorX = (Math.abs(Math.sin(rotacao)) > 0.5 ? larguraZ : larguraX) * 0.92;
    const colisorZ = (Math.abs(Math.sin(rotacao)) > 0.5 ? larguraX : larguraZ) * 0.92;

    this.criarBaseConcreto(x, z, Math.min(8.2, colisorX + 1.0), Math.min(8.2, colisorZ + 1.0), rotacao);
    this.objetosFixos.push(objeto(tipo.geo, "predioKit", criarTransformacao({
      posicao: [x, 0.04, z],
      rotacao: [0, rotacao, 0],
      escala: tipo.escala,
    }), [x, tipo.altura * 0.5, z]));
    this.registrarColisor("predio-low-poly", x, tipo.altura * 0.5, z, colisorX, tipo.altura, colisorZ, {
      margemLateral: 1.6,
      permitePousoNoTopo: Boolean(heliportoFixo),
      superficieY: tipo.altura + 0.16,
    });

    if (heliportoFixo) this.criarHeliportoSecundario(x, z, tipo.altura + 0.1, Math.min(5.4, Math.max(colisorX, colisorZ) * 0.72));
  }

  criarLoteLowPoly(x, z, rnd) {
    const rotacao = Math.floor(rnd() * 4) * Math.PI / 2;
    const modelo = rnd() > 0.5 ? "kit_tank" : "kit_construction_barrier";
    this.criarBaseConcreto(x, z, 5.4, 5.0, rotacao);
    this.objetosFixos.push(objeto(modelo, modelo === "kit_tank" ? "metalEscuro" : "industrialKit", criarTransformacao({
      posicao: [x, 0.04, z],
      rotacao: [0, rotacao, 0],
      escala: modelo === "kit_tank" ? [2.4, 2.4, 2.4] : [3.2, 3.2, 3.2],
    }), [x, 1, z]));
  }

  criarHeliportoSecundario(x, z, altura = 5.2, tamanho = 6.2) {
    const pos = [x, altura + 0.06, z];
    this.objetosFixos.push(objeto("cubo", "heliporto", criarTransformacao({ posicao: pos, escala: [tamanho, 0.12, tamanho] }), pos));
    this.heliportos.push({
      nome: "heliporto-urbano",
      posicao: [x, altura + 0.12, z],
      superficieY: altura + 0.12,
      raio: tamanho * 0.62,
      raioAcionamento: tamanho * 1.05,
      pousoRapido: true,
    });
  }

  criarZepellinPorto() {
    const x = -34;
    const z = -23;
    const pousoX = x;
    const pousoZ = z;
    const helipontoVisualX = x;
    const helipontoVisualZ = z;
    const escalaPredio = [10.4, 7.6, 10.4];
    const altura = 1.01 * escalaPredio[1];
    const yaw = Math.PI / 2;

    this.criarBaseConcreto(x - 1.8, z - 1.2, 20.0, 16.0, yaw);
    this.objetosFixos.push(objeto("kit_industrial_t", "industrialKit", criarTransformacao({ posicao: [x, 0.05, z], rotacao: [0, yaw, 0], escala: escalaPredio }), [x, altura / 2, z]));
    this.objetosFixos.push(objeto("kit_industrial_r", "industrialKit", criarTransformacao({ posicao: [x - 8.5, 0.05, z + 2], rotacao: [0, -Math.PI / 2, 0], escala: [6.4, 5.2, 6.4] }), [x - 8.5, 4, z + 2]));
    this.objetosFixos.push(objeto("kit_chimney", "industrialKit", criarTransformacao({ posicao: [x + 14.8, 0.05, z - 8.5], escala: [2.6, 7.2, 2.6] }), [x + 14.8, 5.5, z - 8.5]));
    this.objetosFixos.push(objeto("kit_tank", "metalEscuro", criarTransformacao({ posicao: [x - 13.2, 0.05, z - 7.8], escala: [3.2, 3.2, 3.2] }), [x - 13.2, 2, z - 7.8]));
    this.registrarColisor("zepellinpouso", x, altura / 2, z, 13.0, altura, 11.8, { permitePousoNoTopo: true });

    const plataformaY = altura + 0.08;
    const superficieY = plataformaY + 0.09;
    this.zepellinPorto = {
      nome: "zepellinpouso",
      posicao: [pousoX, superficieY, pousoZ],
      superficieY,
      trigger: {
        min: [pousoX - 13, superficieY, pousoZ - 13],
        max: [pousoX + 13, superficieY + 16, pousoZ + 13],
      },
      offsetPousoY: 0.42,
    };

    this.objetosFixos.push(objeto("cubo", "heliporto", criarTransformacao({ posicao: [helipontoVisualX, plataformaY, helipontoVisualZ], rotacao: [0, yaw, 0], escala: [11.2, 0.18, 10.4] }), [helipontoVisualX, plataformaY, helipontoVisualZ]));
  }

  criarBaseIndustrial() {
    const x = 26;
    const z = 18;
    this.hangarPrincipal = [x, 0, z];
    this.criarBaseConcreto(x + 0.8, z + 3.6, 15.0, 14.0);
    this.objetosFixos.push(objeto("kit_industrial_r", "industrialKit", criarTransformacao({ posicao: [x, 0.06, z], escala: [7.4, 5.0, 7.4] }), [x, 4, z]));
    this.objetosFixos.push(objeto("kit_industrial_t", "industrialKit", criarTransformacao({ posicao: [x - 1, 0.06, z + 8.5], escala: [5.6, 4.2, 5.6] }), [x - 1, 3, z + 8.5]));
    this.objetosFixos.push(objeto("kit_chimney", "industrialKit", criarTransformacao({ posicao: [x - 8, 0.06, z + 8], escala: [2.5, 6.5, 2.5] }), [x - 8, 5, z + 8]));
    this.objetosFixos.push(objeto("kit_construction_light", "luzQuente", criarTransformacao({ posicao: [x + 9, 0.08, z - 2.2], escala: [2.2, 2.2, 2.2] }), [x + 9, 1, z - 2.2]));
    this.registrarColisor("base-industrial", x, 2.8, z, 10.2, 5.6, 8.0);
  }

  criarDecoracoesLowPoly() {
    const rotas = [
      { eixo: "z", fixo: -0.72, faixa: "x", direcao: 1, velocidade: 4.2, quantidade: 4, fase: 0 },
      { eixo: "z", fixo: 0.72, faixa: "x", direcao: -1, velocidade: 4.2, quantidade: 4, fase: 0 },
      { eixo: "x", fixo: -0.72, faixa: "z", direcao: 1, velocidade: 4.2, quantidade: 4, fase: 9.75 },
      { eixo: "x", fixo: 0.72, faixa: "z", direcao: -1, velocidade: 4.2, quantidade: 4, fase: 9.75 },
    ];

    let contadorCarros = 0;
    for (const rota of rotas) {
      for (let i = 0; i < rota.quantidade; i++) {
        this.carros.push({
          eixo: rota.eixo,
          modelo: contadorCarros % 9,
          cor: (contadorCarros * 3) % 8,
          base: rota.eixo === "z" ? [rota.fixo, 0.12, 0] : [0, 0.12, rota.fixo],
          direcao: rota.direcao,
          velocidade: rota.velocidade,
          fase: rota.fase + i * (CICLO_CARRO / rota.quantidade),
        });
        contadorCarros++;
      }
    }

    this.criarAvenidaCentralArborizada();
    this.criarArborizacaoDosEixosCentrais();
    this.criarAreasVerdesUrbanas();
    this.criarFileirasVerdesPerimetrais();
    this.criarTransicoesVerdes();
    this.criarBosqueBaseIndustrial();
    this.criarCinturaoZepellinPorto();
    this.criarBosqueFrontalZepellinPorto();
  }

  criarNatureKit(modelo, material, x, z, escala = 1, rotacao = 0, y = 0.05) {
    const margem = modelo.includes("tree") ? 5.4 : 4.35;
    if (!this.posicaoSeguraVegetacao(x, z, margem)) return false;
    if (modelo.includes("tree") && !this.espacoLivreParaArvore(x, z)) return false;
    if (modelo.includes("tree") && this.posicaoSobreConcreto(x, z, 0.35)) return false;
    this.objetosFixos.push(objeto(modelo, material, criarTransformacao({
      posicao: [x, y, z],
      rotacao: [0, rotacao, 0],
      escala: [escala, escala, escala],
    }), [x, escala * 0.55, z]));
    if (modelo.includes("tree")) this.arvoresPosicionadas.push([x, z]);
    return true;
  }

  posicaoSeguraVegetacao(x, z, margemRua = 4.8) {
    if (Math.abs(x) > LIMITE_TERRENO || Math.abs(z) > LIMITE_TERRENO) return false;

    if (!this.posicaoEmAreaCorteRua(x, z)) {
      // Mantem troncos, arbustos e rochas fora das pistas e dos cruzamentos usados pelos carros.
      for (const eixo of EIXOS_RUAS) {
        if (Math.abs(x - eixo) < margemRua || Math.abs(z - eixo) < margemRua) return false;
      }
    }

    for (const colisor of this.colisores) {
      const afastamento = colisor.nome === "zepellinpouso" || colisor.nome === "base-industrial" ? 3.0 : 1.8;
      if (
        x > colisor.min[0] - afastamento && x < colisor.max[0] + afastamento &&
        z > colisor.min[2] - afastamento && z < colisor.max[2] + afastamento
      ) return false;
    }

    return true;
  }

  posicaoSobreConcreto(x, z, margem = 0) {
    return this.areasConcreto.some((area) =>
      x > area.minX - margem && x < area.maxX + margem &&
      z > area.minZ - margem && z < area.maxZ + margem
    );
  }

  posicaoNaAreaVerdeZepellinPorto(x, z) {
    return x > AREA_VERDE_ZEPELLINPORTO.minX && x < AREA_VERDE_ZEPELLINPORTO.maxX &&
      z > AREA_VERDE_ZEPELLINPORTO.minZ && z < AREA_VERDE_ZEPELLINPORTO.maxZ;
  }

  posicaoEmAreaCorteRua(x, z) {
    return AREAS_CORTE_RUA.some((area) =>
      x > area.minX && x < area.maxX &&
      z > area.minZ && z < area.maxZ
    );
  }

  posicaoEmAreaFaixaRemovidaBaseIndustrial(x, z) {
    return x > AREA_FAIXAS_REMOVIDAS_BASE_INDUSTRIAL.minX && x < AREA_FAIXAS_REMOVIDAS_BASE_INDUSTRIAL.maxX &&
      z > AREA_FAIXAS_REMOVIDAS_BASE_INDUSTRIAL.minZ && z < AREA_FAIXAS_REMOVIDAS_BASE_INDUSTRIAL.maxZ;
  }

  espacoLivreParaArvore(x, z, distanciaMinima = 4.25) {
    return this.arvoresPosicionadas.every(([ax, az]) => Math.hypot(x - ax, z - az) >= distanciaMinima);
  }

  criarArvoreNature(x, z, rnd, escala = 3.5, preferencia = 0) {
    const modelos = ["nature_tree_default", "nature_tree_oak", "nature_tree_pine"];
    const modelo = modelos[(preferencia + Math.floor(rnd() * modelos.length)) % modelos.length];
    const escalaFinal = escala * (0.9 + rnd() * 0.22);
    const criada = this.criarNatureKit(modelo, "folhaNature", x, z, escalaFinal, rnd() * Math.PI * 2);
    if (criada) this.criarTroncoArvore(x, z, escalaFinal);
    return criada;
  }

  criarTroncoArvore(x, z, escala) {
    this.objetosFixos.push(objeto("cilindro", "madeira", criarTransformacao({
      posicao: [x, 0.42 * escala, z],
      escala: [0.16 * escala, 0.84 * escala, 0.16 * escala],
    }), [x, 0.42 * escala, z]));
  }

  criarArbustoNature(x, z, rnd, escala = 2.2) {
    const modelo = rnd() > 0.45 ? "nature_bush" : "nature_bush_small";
    return this.criarNatureKit(modelo, "folhaBaixa", x, z, escala * (0.85 + rnd() * 0.25), rnd() * Math.PI * 2);
  }

  criarRochaNature(x, z, rnd, escala = 1.35) {
    return this.criarNatureKit("nature_rock_small", "rochaNature", x, z, escala * (0.8 + rnd() * 0.35), rnd() * Math.PI * 2);
  }

  criarGramaNature(x, z, rnd, escala = 1.2) {
    return this.criarNatureKit("nature_grass", "folhaBaixa", x, z, escala * (0.8 + rnd() * 0.45), rnd() * Math.PI * 2);
  }

  criarCanteiroNature(x, z, sx, sz, rotacao = 0) {
    this.criarBaseGrama(x, z, sx, sz, rotacao);
  }

  criarGrupoVerde(x, z, rnd, opcoes = {}) {
    const raio = opcoes.raio ?? 3.2;
    const arvores = opcoes.arvores ?? 2;
    const arbustos = opcoes.arbustos ?? 2;
    const rochas = opcoes.rochas ?? 0;
    const gramas = opcoes.gramas ?? 0;
    this.criarCanteiroNature(x, z, raio * 1.45, raio * 1.15, rnd() * Math.PI);

    let arvoresCriadas = 0;
    for (let tentativa = 0; tentativa < arvores * 6 && arvoresCriadas < arvores; tentativa++) {
      const angulo = rnd() * Math.PI * 2;
      const distancia = raio * (0.42 + rnd() * 0.82);
      if (this.criarArvoreNature(x + Math.cos(angulo) * distancia, z + Math.sin(angulo) * distancia, rnd, opcoes.escalaArvore ?? 3.15, arvoresCriadas)) arvoresCriadas++;
    }

    let arbustosCriados = 0;
    for (let tentativa = 0; tentativa < arbustos * 4 && arbustosCriados < arbustos; tentativa++) {
      const angulo = rnd() * Math.PI * 2;
      const distancia = raio * (0.25 + rnd() * 0.75);
      if (this.criarArbustoNature(x + Math.cos(angulo) * distancia, z + Math.sin(angulo) * distancia, rnd, opcoes.escalaArbusto ?? 1.8)) arbustosCriados++;
    }

    for (let i = 0; i < gramas; i++) {
      const angulo = rnd() * Math.PI * 2;
      const distancia = raio * (0.2 + rnd() * 0.85);
      this.criarGramaNature(x + Math.cos(angulo) * distancia, z + Math.sin(angulo) * distancia, rnd, opcoes.escalaGrama ?? 1.0);
    }

    for (let i = 0; i < rochas; i++) {
      const angulo = rnd() * Math.PI * 2;
      const distancia = raio * (0.35 + rnd() * 0.65);
      this.criarRochaNature(x + Math.cos(angulo) * distancia, z + Math.sin(angulo) * distancia, rnd, opcoes.escalaRocha ?? 1.1);
    }
  }

  criarAvenidaCentralArborizada() {
    const rnd = pseudoAleatorio(1207);
    const zLaterais = [-5.95, 5.95];
    const pontosEntreCruzamentos = [-20.25, -6.75, 6.75, 20.25];
    for (const x of pontosEntreCruzamentos) {
      for (const z of zLaterais) {
        const alinhamento = z > 0 ? 0.35 : -0.35;
        this.criarArvoreNature(x + (rnd() - 0.5) * 0.24, z + alinhamento, rnd, 2.55, z > 0 ? 1 : 0);
        if (rnd() > 0.78) this.criarArbustoNature(x + (rnd() - 0.5) * 0.45, z + alinhamento * 0.55, rnd, 1.05);
      }
    }
  }

  criarArborizacaoDosEixosCentrais() {
    const rnd = pseudoAleatorio(61543);
    const pontosEntreCruzamentos = [-20.25, -6.75, 6.75, 20.25];
    const laterais = [-6.25, 6.25];

    for (const z of pontosEntreCruzamentos) {
      for (const x of laterais) {
        this.criarArvoreNature(x + (rnd() - 0.5) * 0.22, z + (rnd() - 0.5) * 0.32, rnd, 2.45, z > 0 ? 2 : 0);
        if (rnd() > 0.65) this.criarArbustoNature(x + (rnd() - 0.5) * 0.5, z + (rnd() - 0.5) * 0.55, rnd, 0.95);
      }
    }

    for (const x of pontosEntreCruzamentos) {
      for (const z of laterais) {
        this.criarArvoreNature(x + (rnd() - 0.5) * 0.32, z + (rnd() - 0.5) * 0.22, rnd, 2.35, x > 0 ? 1 : 2);
        if (rnd() > 0.72) this.criarGramaNature(x + (rnd() - 0.5) * 0.65, z + (rnd() - 0.5) * 0.65, rnd, 0.75);
      }
    }
  }

  criarAreasVerdesUrbanas() {
    const rnd = pseudoAleatorio(34091);
    const grupos = [
      [20.2, -20.2, 3.1, 2, 1],
      [20.1, 20.0, 3.0, 2, 1],
      [-20.4, 20.2, 3.0, 2, 1],
      [-20.3, -6.6, 2.7, 1, 1],
      [6.7, 20.4, 2.7, 1, 1],
      [-6.7, -20.2, 2.7, 1, 1],
      [20.2, 6.7, 2.7, 1, 1],
      [33.5, 6.1, 2.5, 1, 0],
      [-6.7, 33.6, 2.6, 1, 0],
      [6.7, -33.5, 2.6, 1, 0],
    ];

    for (const [x, z, raio, arvores, arbustos] of grupos) {
      this.criarGrupoVerde(x, z, rnd, { raio, arvores, arbustos, rochas: 0, escalaArvore: 2.85 });
    }

    for (const faixa of [
      { xMin: -42, xMax: 42, zMin: 36.2, zMax: 42 },
      { xMin: -42, xMax: 42, zMin: -42, zMax: -36.2 },
      { xMin: 36.2, xMax: 42, zMin: -30, zMax: 30 },
    ]) {
      for (let i = 0; i < 6; i++) {
        const x = faixa.xMin + rnd() * (faixa.xMax - faixa.xMin);
        const z = faixa.zMin + rnd() * (faixa.zMax - faixa.zMin);
        this.criarArvoreNature(x, z, rnd, 2.8 + rnd() * 0.5, i);
        if (rnd() > 0.9) this.criarArbustoNature(x + (rnd() - 0.5) * 2.4, z + (rnd() - 0.5) * 2.4, rnd, 1.25);
      }
    }
  }

  criarFileirasVerdesPerimetrais() {
    const rnd = pseudoAleatorio(44721);
    const pontos = [-39.5, -20.25, 6.75, 33.75];

    for (const x of pontos) {
      this.criarArvoreNature(x + (rnd() - 0.5) * 0.45, 39.2 + (rnd() - 0.5) * 1.1, rnd, 2.75, 1);
      this.criarArvoreNature(x + (rnd() - 0.5) * 0.45, -39.2 + (rnd() - 0.5) * 1.1, rnd, 2.75, 2);
    }

    for (const z of pontos.slice(1, -1)) {
      this.criarArvoreNature(39.2 + (rnd() - 0.5) * 1.1, z + (rnd() - 0.5) * 0.45, rnd, 2.7, 0);
      this.criarArvoreNature(-39.2 + (rnd() - 0.5) * 1.1, z + (rnd() - 0.5) * 0.45, rnd, 2.7, 1);
    }
  }

  criarTransicoesVerdes() {
    const rnd = pseudoAleatorio(7719);
    const pontos = [
      [19.5, 8.6, 2.6],
      [19.5, 32.0, 2.8],
      [32.5, 32.0, 2.8],
      [-23.0, -8.4, 2.6],
      [-23.0, -34.5, 2.9],
      [-40.8, -20.2, 2.7],
    ];

    for (const [x, z, raio] of pontos) {
      this.criarGrupoVerde(x, z, rnd, { raio, arvores: 1, arbustos: 1, rochas: 0, escalaArvore: 2.75 });
    }
  }

  criarBosqueBaseIndustrial() {
    const rnd = pseudoAleatorio(88421);
    const grupos = [
      [9.2, 34.8, 3.0, 1, 1],
      [17.2, 38.8, 2.9, 1, 1],
      [30.4, 38.4, 3.1, 1, 1],
      [43.4, 35.0, 3.2, 1, 1],
      [47.0, 24.2, 3.0, 1, 1],
      [42.0, 12.0, 2.8, 1, 0],
      [10.4, 18.8, 2.8, 1, 0],
    ];

    for (const [x, z, raio, arvores, arbustos] of grupos) {
      this.criarGrupoVerde(x, z, rnd, {
        raio,
        arvores,
        arbustos,
        rochas: 0,
        escalaArvore: 2.65,
        escalaArbusto: 1.35,
        escalaGrama: 1.05,
      });
    }

    const arvoresEspacadas = [
      [7.0, 27.5],
      [23.8, 41.5],
      [49.0, 30.6],
      [50.2, 16.4],
    ];
    for (const [x, z] of arvoresEspacadas) {
      this.criarArvoreNature(x + (rnd() - 0.5) * 0.7, z + (rnd() - 0.5) * 0.7, rnd, 2.55, 2);
      if (rnd() > 0.82) this.criarArbustoNature(x + (rnd() - 0.5) * 2.4, z + (rnd() - 0.5) * 2.4, rnd, 1.15);
    }
  }

  criarCinturaoZepellinPorto() {
    const rnd = pseudoAleatorio(99173);
    const centroX = -34;
    const centroZ = -23;
    const pontos = [
      [-48.0, -36.0, 3.4, 1],
      [-48.2, -24.5, 3.3, 1],
      [-47.2, -13.2, 3.0, 1],
      [-41.5, -42.8, 3.2, 1],
      [-32.0, -44.2, 3.1, 1],
      [-21.5, -41.0, 3.1, 1],
      [-12.5, -34.0, 3.0, 1],
      [-10.5, -21.0, 3.0, 1],
      [-15.8, -10.5, 2.9, 1],
      [-30.0, -10.2, 2.9, 1],
      [-43.0, -10.8, 2.9, 1],
    ];

    for (const [x, z, raio, arvores] of pontos) {
      this.criarGrupoVerde(x, z, rnd, { raio, arvores, arbustos: 1, rochas: 0, escalaArvore: 2.7, escalaArbusto: 1.25 });
    }

    for (let i = 0; i < 10; i++) {
      const angulo = -0.36 + i * (Math.PI * 1.55 / 9);
      const raio = 23.0 + (i % 3) * 3.1;
      const x = centroX + Math.cos(angulo) * raio;
      const z = centroZ + Math.sin(angulo) * raio;
      if (x > -6 || z > -6) continue;
      this.criarArvoreNature(x, z, rnd, 2.6 + rnd() * 0.45, i);
      if (i % 5 === 0) this.criarArbustoNature(x + (rnd() - 0.5) * 2.8, z + (rnd() - 0.5) * 2.8, rnd, 1.15);
    }

    const bordaExpandida = [
      [-43.8, -46.0],
      [-33.0, -47.2],
      [-22.4, -45.0],
      [-8.8, -25.0],
      [-9.4, -13.4],
    ];
    for (const [x, z] of bordaExpandida) {
      this.criarArvoreNature(x + (rnd() - 0.5) * 0.85, z + (rnd() - 0.5) * 0.85, rnd, 2.65, 2);
      if (rnd() > 0.9) this.criarArbustoNature(x + (rnd() - 0.5) * 3.2, z + (rnd() - 0.5) * 3.2, rnd, 1.1);
    }
  }

  criarBosqueFrontalZepellinPorto() {
    const rnd = pseudoAleatorio(58321);
    this.criarGrupoVerde(-17.4, -18.6, rnd, {
      raio: 5.2,
      arvores: 2,
      arbustos: 2,
      rochas: 1,
      escalaArvore: 2.55,
      escalaArbusto: 1.45,
      escalaGrama: 1.15,
    });

    const arvoresPlanejadas = [
      [-24.5, -24.5],
      [-24.8, -16.2],
    ];
    for (const [x, z] of arvoresPlanejadas) {
      this.criarArvoreNature(x, z, rnd, 2.35, 1);
      if (rnd() > 0.65) this.criarArbustoNature(x + (rnd() - 0.5) * 0.45, z + (rnd() - 0.5) * 0.45, rnd, 1.05);
    }
  }

  criarPosteLowPoly(x, z, rotacaoY = 0) {
    this.postes.push([x, 0, z]);
    this.objetosFixos.push(objeto("kit_light_curved", "metalEscuro", criarTransformacao({ posicao: [x, 0.04, z], rotacao: [0, rotacaoY, 0], escala: [1.75, 1.75, 1.75] }), [x, 1.5, z]));
  }

  buscarHeliportoUrbano(posicao) {
    let melhor = null;
    let menorDistancia = Infinity;
    for (const heliporto of this.heliportos) {
      const distancia = Math.hypot(posicao[0] - heliporto.posicao[0], posicao[2] - heliporto.posicao[2]);
      const raioAcionamento = heliporto.raioAcionamento ?? heliporto.raio;
      if (distancia < raioAcionamento && distancia < menorDistancia) {
        melhor = heliporto;
        menorDistancia = distancia;
      }
    }
    return melhor;
  }

  atualizar(dt, tempo) {
    this.tempo += dt;
    this.carrosDinamicos = [];
    const modelos = [
      "kit_sedan",
      "kit_taxi",
      "kit_van",
      "kit_car_sport",
      "kit_car_suv",
      "kit_car_race",
      "kit_car_police",
      "kit_car_ambulance",
      "kit_car_truck",
    ];
    const materiaisCarros = [
      "carroKit",
      "carroAzul",
      "carroAmarelo",
      "carroVerde",
      "carroBranco",
      "carroRoxo",
      "carroLaranja",
      "carroCiano",
    ];

    for (const carro of this.carros) {
      const ciclo = this.atualizarProgressoCarro(carro, dt, tempo);
      const pos = [...carro.base];
      let rotY = 0;
      if (carro.eixo === "z") {
        pos[2] = ciclo * carro.direcao;
        rotY = carro.direcao > 0 ? 0 : Math.PI;
      }
      else {
        pos[0] = ciclo * carro.direcao;
        rotY = carro.direcao > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      const modelo = modelos[carro.modelo % modelos.length];
      const escala = modelo === "kit_car_truck" || modelo === "kit_car_ambulance" ? 0.74 : 0.82;
      this.carrosDinamicos.push(objeto(modelo, materiaisCarros[carro.cor % materiaisCarros.length], criarTransformacao({
        posicao: pos,
        rotacao: [0, rotY, 0],
        escala: [escala, escala, escala],
      }), pos));
    }
  }

  atualizarProgressoCarro(carro, dt, tempo) {
    if (carro.progresso === undefined) carro.progresso = carro.fase % CICLO_CARRO;
    carro.progresso = (carro.progresso + carro.velocidade * dt) % CICLO_CARRO;
    return carro.progresso - LIMITE_CARRO;
  }

  objetos() {
    return [...this.objetosFixos, ...(this.carrosDinamicos || [])];
  }

  reiniciar() {
    this.tempo = 0;
    this.carrosDinamicos = [];
    for (const carro of this.carros) {
      carro.progresso = carro.fase % CICLO_CARRO;
    }
  }
}
