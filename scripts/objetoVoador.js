/*
  Modelo e comportamento do navio voador.
  Este modulo controla movimento, pouso automatico, colisoes, animacao das
  helices, luzes do veiculo e montagem visual das partes que formam o navio.
*/
import { criarTransformacao, multiplicarTransformacao, suavizarAtual, limitar } from "./util/matematica.js";

function objeto(geometria, material, matriz, posicaoReferencia, extra = {}) {
  return { geometria, material, matriz, posicaoReferencia, ...extra };
}

const ALTURA_CENTRO_POUSADO = 3.05;
const ALTURA_TOPO_NAVIO = 3.55;
const GIRO_HELICE_VOO = 18;
const GIRO_HELICE_POUSO = 8;
const GIRO_HELICE_POUSADO = 2.4;

export class Navio {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this.posicao = [0, 24, -10];
    this.velocidade = 0;
    this.rotacaoY = 0.12;
    this.inclinacao = 0;
    this.altitudeAlvo = 24;
    this.helice = 0;
    this.oscilacao = 0;
    this.ultimoGiro = 0;
    this.raioColisao = 2.8;
    this.luzes = [];
    this.pousandoEm = null;
    this.pousoManual = null;
    this.colidiu = false;
    this.pousoContextual = false;
    this.noSolo = false;
    this.bloqueioPousoContextual = false;
    this.tempoSobreZepellinPorto = 0;
  }

  // Ao decolar, impede que o pouso automatico religue antes do navio sair da zona.
  alternarPouso(controles, cidade) {
    const deveDecolar = controles.pousoAutomatico || this.pousoContextual || this.noSolo || this.pousandoEm;
    if (deveDecolar) {
      controles.pousoAutomatico = false;
      this.bloqueioPousoContextual = true;
      this.pousandoEm = null;
      this.pousoManual = null;
      this.pousoContextual = false;
      this.tempoSobreZepellinPorto = 0;
      this.altitudeAlvo = Math.max(this.posicao[1] + 8, 13);
      this.velocidade = Math.max(this.velocidade, 2.2);
      this.noSolo = false;
      return;
    }
    const alvoContextual = this.estaNaZonaDePouso(cidade?.zepellinPorto);
    if (alvoContextual) {
      this.pousoManual = null;
      controles.pousoAutomatico = true;
      return;
    }
    this.pousoManual = cidade?.buscarHeliportoUrbano?.(this.posicao) || null;
    controles.pousoAutomatico = Boolean(this.pousoManual);
  }

  atualizar(dt, controles, cidade) {
    const entrada = controles.eixoMovimento();
    this.colidiu = false;
    this.noSolo = false;

    const dentroDaZona = this.estaNaZonaDePouso(cidade?.zepellinPorto);
    if (!dentroDaZona) {
      this.tempoSobreZepellinPorto = 0;
      this.bloqueioPousoContextual = false;
    } else if (!this.bloqueioPousoContextual && !controles.pousoAutomatico) {
      this.tempoSobreZepellinPorto += dt;
    }
    // Ativa o pouso contextual apenas depois que o navio permanece sobre o porto.
    this.pousoContextual = dentroDaZona && !this.bloqueioPousoContextual && this.tempoSobreZepellinPorto >= 2;
    const pousoAtivo = controles.pousoAutomatico || this.pousoContextual;

    const alvoPouso = this.escolherAlvoDePouso(cidade, controles.pousoAutomatico);
    if (pousoAtivo && alvoPouso) {
      this.pousandoEm = alvoPouso;
      this.atualizarPouso(dt, this.pousandoEm);
    } else {
      this.pousandoEm = null;
      this.pousoManual = null;
      this.altitudeAlvo = limitar(this.altitudeAlvo + entrada.vertical * 8 * dt, 3.1, 30);
      const alvoVel = entrada.frente * 13.5;
      this.velocidade = suavizarAtual(this.velocidade, alvoVel, 3.0, dt);
    }

    const giro = pousoAtivo ? 0 : -entrada.lado * 1.45;
    if (!pousoAtivo) this.rotacaoY += giro * dt;
    this.ultimoGiro = suavizarAtual(this.ultimoGiro, giro, 5, dt);
    this.inclinacao = suavizarAtual(this.inclinacao, -this.ultimoGiro * 0.24, 4.5, dt);

    const frente = [Math.sin(this.rotacaoY), 0, Math.cos(this.rotacaoY)];
    const proxima = [
      this.posicao[0] + frente[0] * this.velocidade * dt,
      this.posicao[1],
      this.posicao[2] + frente[2] * this.velocidade * dt,
    ];
    // Verifica se o navio pode ocupar a proxima posicao horizontal.
    this.aplicarColisaoHorizontal(proxima, cidade?.colisores || [], pousoAtivo);

    this.posicao[0] = limitar(this.posicao[0], -58, 58);
    this.posicao[2] = limitar(this.posicao[2], -58, 58);

    this.oscilacao += dt;
    const pertoDoSolo = Math.max(0, 1 - (this.posicao[1] - 2.2) / 5);
    const pousoEstavel = pousoAtivo || this.noSolo;
    // Adiciona uma oscilacao leve durante o voo e remove essa oscilacao no pouso.
    const gravidadeLeve = pousoEstavel ? 0 : pertoDoSolo * 0.55;
    const boiar = pousoEstavel ? 0 : Math.sin(this.oscilacao * 1.35) * (0.18 - pertoDoSolo * 0.1);
    const proximaY = suavizarAtual(this.posicao[1], this.altitudeAlvo + boiar - gravidadeLeve, pousoAtivo ? 1.55 : 2.7, dt);
    this.aplicarColisaoVertical(proximaY, cidade?.colisores || [], alvoPouso, pousoAtivo);

    const giroHelice = this.noSolo
      ? GIRO_HELICE_POUSADO
      : pousoAtivo
        ? GIRO_HELICE_POUSO
        : GIRO_HELICE_VOO + Math.abs(this.velocidade) * 2.8;
    this.helice += dt * giroHelice;
  }

  estaNaZonaDePouso(zepellinPorto) {
    if (!zepellinPorto?.trigger) return false;
    const t = zepellinPorto.trigger;
    return this.posicao[0] >= t.min[0] && this.posicao[0] <= t.max[0] &&
      this.posicao[2] >= t.min[2] && this.posicao[2] <= t.max[2];
  }

  escolherAlvoDePouso(cidade, pousoManualAtivo) {
    if (this.pousoContextual && cidade?.zepellinPorto) return cidade.zepellinPorto;
    if (pousoManualAtivo && this.estaNaZonaDePouso(cidade?.zepellinPorto)) return cidade.zepellinPorto;
    if (pousoManualAtivo) {
      if (!this.pousoManual) this.pousoManual = cidade?.buscarHeliportoUrbano?.(this.posicao) || null;
      return this.pousoManual;
    }
    return null;
  }

  atualizarPouso(dt, alvo) {
    const posAlvo = alvo.posicao || alvo;
    const superficieY = alvo.superficieY ?? posAlvo[1];
    const centroPousado = ALTURA_CENTRO_POUSADO + (alvo.offsetPousoY || 0);
    const dx = posAlvo[0] - this.posicao[0];
    const dz = posAlvo[2] - this.posicao[2];
    const distancia = Math.hypot(dx, dz);

    // O pouso centraliza e desce mantendo a orientacao atual do Navio.
    this.inclinacao = suavizarAtual(this.inclinacao, 0, 5.5, dt);

    if (distancia > 0.5) {
      const rapidezManual = alvo.pousoRapido ? 1.45 : 0.75;
      const freioManual = alvo.pousoRapido ? 4.6 : 2.8;
      const descidaManual = alvo.pousoRapido ? 1.75 : 1.0;
      const margemAltura = alvo.pousoRapido ? 3.2 : 4.8;
      this.posicao[0] = suavizarAtual(this.posicao[0], posAlvo[0], rapidezManual, dt);
      this.posicao[2] = suavizarAtual(this.posicao[2], posAlvo[2], rapidezManual, dt);
      this.velocidade = suavizarAtual(this.velocidade, 0, freioManual, dt);
      this.altitudeAlvo = suavizarAtual(this.altitudeAlvo, Math.max(superficieY + centroPousado + margemAltura, 8), descidaManual, dt);
    } else {
      this.velocidade = suavizarAtual(this.velocidade, 0, 3.5, dt);
      this.posicao[0] = suavizarAtual(this.posicao[0], posAlvo[0], 2.2, dt);
      this.posicao[2] = suavizarAtual(this.posicao[2], posAlvo[2], 2.2, dt);
      this.altitudeAlvo = suavizarAtual(this.altitudeAlvo, superficieY + centroPousado, 1.25, dt);

      const alturaPousada = superficieY + centroPousado;
      if (distancia < 0.08 && Math.abs(this.posicao[1] - alturaPousada) < 0.08) {
        this.posicao[0] = posAlvo[0];
        this.posicao[2] = posAlvo[2];
        this.altitudeAlvo = alturaPousada;
        this.velocidade = 0;
        this.inclinacao = 0;
      }
    }
  }

  aplicarColisaoHorizontal(proxima, colisores, pousoAtivo) {
    for (const c of colisores) {
      if (pousoAtivo && c.permitePousoNoTopo) continue;
      const margem = c.margemLateral ?? this.raioColisao;
      const dentroX = proxima[0] + margem > c.min[0] && proxima[0] - margem < c.max[0];
      const dentroY = proxima[1] + 1.4 > c.min[1] && proxima[1] - 1.4 < c.max[1];
      const dentroZ = proxima[2] + margem > c.min[2] && proxima[2] - margem < c.max[2];
      if (dentroX && dentroY && dentroZ) {
        // Resposta simples e robusta: bloqueia o deslocamento e dissipa velocidade.
        this.velocidade *= -0.08;
        this.colidiu = true;
        return;
      }
    }
    this.posicao[0] = proxima[0];
    this.posicao[2] = proxima[2];
  }

  aplicarColisaoVertical(proximaY, colisores, zepellinPorto, pousoAtivo) {
    const raio = this.raioColisao;
    const alturaBaixo = proximaY - ALTURA_CENTRO_POUSADO;
    const alturaCima = proximaY + ALTURA_TOPO_NAVIO;
    let ySeguro = Math.max(proximaY, ALTURA_CENTRO_POUSADO);
    let pousouEmSuperficie = false;

    for (const c of colisores) {
      // Colisao vertical separa teto/topo da colisao lateral para impedir clipping ao descer.
      const margem = c.margemLateral ?? raio;
      const sobreX = this.posicao[0] + margem > c.min[0] && this.posicao[0] - margem < c.max[0];
      const sobreZ = this.posicao[2] + margem > c.min[2] && this.posicao[2] - margem < c.max[2];
      if (!sobreX || !sobreZ) continue;

      const teto = c.max[1] + ALTURA_CENTRO_POUSADO;
      const bateuTopo = alturaBaixo < c.max[1] && alturaCima > c.max[1];
      const bateuTetoInterno = alturaCima > c.min[1] && alturaBaixo < c.min[1];
      if (c.permitePousoNoTopo && pousoAtivo && zepellinPorto) {
        const topoPousavel = c.max[1] + ALTURA_CENTRO_POUSADO;
        ySeguro = Math.max(ySeguro, topoPousavel);
        pousouEmSuperficie = proximaY <= topoPousavel + 0.08;
        continue;
      }
      if (bateuTopo && pousoAtivo && zepellinPorto) {
        ySeguro = Math.max(ySeguro, teto);
        pousouEmSuperficie = true;
        continue;
      }
      if (bateuTopo || bateuTetoInterno) {
        ySeguro = Math.max(ySeguro, teto);
        this.velocidade *= 0.35;
        this.colidiu = true;
      }
    }

    const alvoY = zepellinPorto
      ? (zepellinPorto.superficieY ?? zepellinPorto.posicao?.[1] ?? 0) + ALTURA_CENTRO_POUSADO + (zepellinPorto.offsetPousoY || 0)
      : ALTURA_CENTRO_POUSADO;
    this.noSolo = ySeguro <= ALTURA_CENTRO_POUSADO + 0.08 || pousouEmSuperficie || (pousoAtivo && zepellinPorto && ySeguro <= alvoY + 0.08);
    this.posicao[1] = this.noSolo && pousoAtivo ? alvoY : ySeguro;
  }

  matrizRaiz() {
    return criarTransformacao({
      posicao: this.posicao,
      rotacao: [0, this.rotacaoY, this.inclinacao],
      escala: [1, 1, 1],
    });
  }

  criarParte(lista, pai, geometria, material, transformacao, extra = {}) {
    const local = criarTransformacao(transformacao);
    const matriz = multiplicarTransformacao(pai, local);
    // Guarda a posicao da parte para auxiliar ordenacao de transparencia e luzes.
    const ref = twgl.m4.transformPoint(matriz, [0, 0, 0]);
    lista.push(objeto(geometria, material, matriz, ref, extra));
    return matriz;
  }

  objetos() {
    const objetos = [];
    this.luzes = [];
    const raiz = this.matrizRaiz();

    // Sombra simples no chao: melhora a leitura de altura sem precisar de shadow map.
    const escalaSombra = limitar(1.35 - this.posicao[1] / 36, 0.35, 1.1);
    objetos.push(objeto("esfera", "sombra", criarTransformacao({
      posicao: [this.posicao[0], 0.045, this.posicao[2]],
      escala: [5.8 * escalaSombra, 0.025, 11.5 * escalaSombra],
      rotacao: [0, this.rotacaoY, 0],
    }), [this.posicao[0], 0, this.posicao[2]], { alpha: 0.28 }));

    this.criarParte(objetos, raiz, "kit_ship_pirate", "couro", { posicao: [0, -3.05, 0], escala: [0.62, 0.62, 0.62] });

    for (const z of [-2.9, 0.45, 3.55]) {
      this.criarParte(objetos, raiz, z === 0.45 ? "kit_mast_ropes" : "kit_mast", "cobre", {
        posicao: [0, -0.98, z],
        escala: [0.46, 0.46, 0.46],
      });
    }

    const cabine = this.criarParte(objetos, raiz, "cubo", "metalEscuro", { posicao: [0, -0.95, 3.92], escala: [1.35, 1.0, 1.55] });
    const vidroAlpha = { alpha: 0.08 };
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [0, 0.02, 0.525], escala: [1.04, 0.88, 0.05] }, vidroAlpha);
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [0, 0.02, -0.525], escala: [1.04, 0.88, 0.05] }, vidroAlpha);
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [-0.525, 0.02, 0], escala: [0.05, 0.88, 1.04] }, vidroAlpha);
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [0.525, 0.02, 0], escala: [0.05, 0.88, 1.04] }, vidroAlpha);
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [0, 0.465, 0], escala: [1.04, 0.05, 1.04] }, { alpha: 0.06 });
    this.criarParte(objetos, cabine, "cubo", "vidro", { posicao: [0, -0.465, 0], escala: [1.04, 0.05, 1.04] }, { alpha: 0.04 });
    this.criarParte(objetos, cabine, "cubo", "cobre", { posicao: [0, -0.42, 0.02], escala: [1.18, 0.08, 1.18] });

    for (const lado of [-1, 1]) {
      this.criarParte(objetos, raiz, "kit_cannon", "cobre", { posicao: [lado * 1.78, -1.95, 1.55], rotacao: [0, lado > 0 ? Math.PI / 2 : -Math.PI / 2, 0], escala: [0.48, 0.48, 0.48] });
      this.criarParte(objetos, raiz, "kit_anchor", "metalEscuro", { posicao: [lado * 1.72, -2.25, -2.85], rotacao: [0.45, 0, lado * 0.75], escala: [0.56, 0.56, 0.56] });
      this.criarParte(objetos, raiz, "cubo", "cobre", { posicao: [lado * 1.88, -1.48, 0.4], escala: [0.08, 0.08, 6.4] });
    }

    this.criarHeliceLateral(objetos, raiz, [-2.6, -1.05, 2.25], 0);
    this.criarHeliceLateral(objetos, raiz, [2.6, -1.05, 2.25], Math.PI);
    this.criarHeliceLateral(objetos, raiz, [-2.45, -1.15, -2.35], 0);
    this.criarHeliceLateral(objetos, raiz, [2.45, -1.15, -2.35], Math.PI);
    this.criarHeliceTraseira(objetos, raiz, [0, -1.1, -4.55]);

    this.criarParte(objetos, raiz, "cubo", "cobre", { posicao: [0, -0.35, -4.65], escala: [3.3, 0.09, 0.72] });
    this.criarParte(objetos, raiz, "cubo", "cobre", { posicao: [0, 0.48, -4.55], escala: [0.1, 1.75, 0.72] });

    const farol = multiplicarTransformacao(raiz, criarTransformacao({ posicao: [0, -1.35, 4.72] }));
    const luzEsq = multiplicarTransformacao(raiz, criarTransformacao({ posicao: [-1.45, -1.75, 3.0] }));
    const luzDir = multiplicarTransformacao(raiz, criarTransformacao({ posicao: [1.45, -1.75, 3.0] }));
    this.luzes.push({ posicao: twgl.m4.transformPoint(farol, [0, 0, 0]), cor: [1, 0.58, 0.22], intensidade: 4.2 });
    this.luzes.push({ posicao: twgl.m4.transformPoint(luzEsq, [0, 0, 0]), cor: [1, 0.22, 0.7], intensidade: 2.9 });
    this.luzes.push({ posicao: twgl.m4.transformPoint(luzDir, [0, 0, 0]), cor: [0.2, 0.9, 1], intensidade: 2.9 });

    return objetos;
  }

  criarHeliceLateral(objetos, raiz, posicao, rotacaoY) {
    this.criarSuporteHeliceLateral(objetos, raiz, posicao, rotacaoY);
    const suporte = multiplicarTransformacao(raiz, criarTransformacao({
      posicao,
      rotacao: [0, 0, Math.PI / 2],
    }));
    this.criarParte(objetos, suporte, "cilindro", "cobre", {
      rotacao: [0, 0, Math.PI / 2],
      escala: [0.08, 0.34, 0.08],
    });
    this.criarParte(objetos, suporte, "esfera", "cobre", { escala: [0.26, 0.26, 0.26] });
    for (let i = 0; i < 4; i++) {
      this.criarParte(objetos, suporte, "cubo", i % 2 === 0 ? "luzQuente" : "cobre", {
        rotacao: [this.helice + i * Math.PI / 2, rotacaoY, 0],
        escala: [0.10, 1.25, 0.18],
      });
    }
  }

  criarSuporteHeliceLateral(objetos, raiz, posicao, rotacaoY) {
    const lado = posicao[0] >= 0 ? 1 : -1;
    const yTopo = posicao[1] - 0.04;
    const yBase = -1.48;
    const yCentro = (yTopo + yBase) * 0.5;
    const xHasteLateral = lado * 1.88;
    const xCentroBase = (posicao[0] + xHasteLateral) * 0.5;
    const comprimentoBase = Math.abs(posicao[0] - xHasteLateral);
    const zCasco = posicao[2];

    this.criarParte(objetos, raiz, "cubo", "cobre", {
      posicao: [posicao[0], yCentro, posicao[2]],
      escala: [0.08, Math.abs(yTopo - yBase), 0.08],
    });

    this.criarParte(objetos, raiz, "cubo", "cobre", {
      posicao: [posicao[0], yTopo, posicao[2]],
      escala: [0.26, 0.08, 0.12],
    });

    this.criarParte(objetos, raiz, "cubo", "cobre", {
      posicao: [xCentroBase, yBase, zCasco],
      escala: [comprimentoBase, 0.1, 0.1],
    });
  }

  criarHeliceTraseira(objetos, raiz, posicao) {
    const eixo = this.criarParte(objetos, raiz, "cilindro", "metalEscuro", {
      posicao,
      rotacao: [Math.PI / 2, 0, 0],
      escala: [0.18, 0.62, 0.18],
    });
    for (let i = 0; i < 3; i++) {
      this.criarParte(objetos, eixo, "cubo", "cobre", {
        rotacao: [0, 0, this.helice * 1.35 + i * (Math.PI * 2 / 3)],
        escala: [0.12, 1.15, 0.08],
      });
    }
  }
}
