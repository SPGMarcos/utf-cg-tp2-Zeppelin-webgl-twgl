/*
  Sistema de cameras da simulacao.
  Este modulo calcula as tres cameras disponiveis: aerea, cinematografica
  e cabine, sempre acompanhando o navio de forma suavizada.
*/
import { somar } from "./util/matematica.js";

export class Cameras {
  constructor() {
    this.fov = (54 * Math.PI) / 180;
    this.near = 0.1;
    this.far = 980;
    this.reiniciar();
  }

  reiniciar() {
    this.olhoAtual = null;
    this.alvoAtual = null;
    this.referenciaVoo = null;
  }

  // Interpolacao exponencial deixa a camera cinematografica sem atrasar demais o controle.
  interpolarVetor(atual, alvo, rigidez) {
    if (!atual) return [...alvo];
    const t = 1 - Math.exp(-rigidez);
    return [
      atual[0] + (alvo[0] - atual[0]) * t,
      atual[1] + (alvo[1] - atual[1]) * t,
      atual[2] + (alvo[2] - atual[2]) * t,
    ];
  }
  
  // Escolhe a camera ativa e calcula as matrizes de visao e projecao.
  calcular(gl, veiculo, controles, tempo = 0) {
    const m4 = twgl.m4;
    const aspecto = gl.canvas.clientWidth / Math.max(1, gl.canvas.clientHeight);
    if (!this.referenciaVoo || !veiculo.noSolo) {
      this.referenciaVoo = {
        posicao: [...veiculo.posicao],
        rotacaoY: veiculo.rotacaoY,
        oscilacaoLateral: Math.sin(tempo * 0.55) * 0.85,
      };
    }

    const referencia = veiculo.noSolo ? this.referenciaVoo : veiculo;
    const velocidade = Math.min(1, Math.abs(veiculo.velocidade) / 18);
    const fovDinamico = this.fov + velocidade * 0.1;
    const projection = m4.perspective(fovDinamico, aspecto, this.near, this.far);
    const yaw = referencia.rotacaoY;
    const frente = [Math.sin(yaw), 0, Math.cos(yaw)];
    const direita = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const pos = referencia.posicao;

    let olhoAlvo;
    let alvoAlvo;
    let nome;

    if (controles.camera === 1) {
      const zoom = controles.zoomAereo || 1;
      const distancia = 78 * zoom;
      const altitude = 58 * zoom;
      olhoAlvo = [pos[0] - frente[0] * distancia, pos[1] + altitude, pos[2] - frente[2] * distancia];
      alvoAlvo = [pos[0] + frente[0] * 9, pos[1] - 6, pos[2] + frente[2] * 9];
      nome = "Câmera 1 - aérea";
    } else if (controles.camera === 2) {
      // A camera lateral fica sempre fora do volume do navio e mira no centro alto do balao.
      const direcoes = [
        [-frente[0], 0, -frente[2]],
        [frente[0], 0, frente[2]],
        [-direita[0], 0, -direita[2]],
        [direita[0], 0, direita[2]],
      ];
      const lateral = direcoes[controles.lateral];
      const oscilacao = veiculo.noSolo ? referencia.oscilacaoLateral : Math.sin(tempo * 0.55) * 0.85;
      const deslocamentoFrente = controles.lateral >= 2 ? 7.5 : 5.0;
      olhoAlvo = [pos[0] + lateral[0] * 33 + frente[0] * deslocamentoFrente, pos[1] + 8.0 + oscilacao, pos[2] + lateral[2] * 33 + frente[2] * deslocamentoFrente];
      alvoAlvo = [pos[0] + frente[0] * 1.2, pos[1] - 0.25, pos[2] + frente[2] * 1.2];
      nome = "Câmera 2 - cinematográfica";
    } else {
      const yawExtra = controles.olharCockpit.yaw;
      const pitch = controles.olharCockpit.pitch;
      const dir = [Math.sin(yaw + yawExtra), Math.sin(pitch), Math.cos(yaw + yawExtra)];
      olhoAlvo = somar(pos, [frente[0] * 3.95, -0.55 + pitch * 0.12, frente[2] * 3.95]);
      alvoAlvo = somar(olhoAlvo, [dir[0] * 18, dir[1] * 18, dir[2] * 18]);
      nome = "Câmera 3 - cabine";
    }

    const rigidez = controles.camera === 3 ? 0.45 : 0.12;
    this.olhoAtual = this.interpolarVetor(this.olhoAtual, olhoAlvo, rigidez);
    this.alvoAtual = this.interpolarVetor(this.alvoAtual, alvoAlvo, rigidez);

    const camera = m4.lookAt(this.olhoAtual, this.alvoAtual, [0, 1, 0]);
    const view = m4.inverse(camera);
    return { projection, view, cameraPosition: this.olhoAtual, nome };
  }
}
