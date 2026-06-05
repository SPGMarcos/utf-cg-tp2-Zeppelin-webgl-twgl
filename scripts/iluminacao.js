export class SistemaIluminacao {
  constructor() {
    this.luzesPontuais = [];
    this.corFog = [0.10, 0.18, 0.15];
    this.distanciaFog = 145;
    this.direcao = [0.25, -1, 0.35];
    this.corDirecional = [1, 0.95, 0.84];
    this.intensidadeDirecional = 1.85;
    this.intensidadeAmbiente = 0.68;
    this.intensidadeEmissivo = 1;
    this.reiniciar();
  }

  reiniciar() {
    this.ligada = false;
    this.fogLigado = false;
  }

  alternarLuz() {
    this.ligada = !this.ligada;
  }

  alternarFog() {
    this.fogLigado = !this.fogLigado;
  }

  atualizar(tempo, postes, luzesVeiculo) {
    const ciclo = (Math.sin(tempo * 0.055) + 1) * 0.5;
    const anguloSol = tempo * 0.025;
    this.direcao = [Math.cos(anguloSol) * 0.38, -1.0, Math.sin(anguloSol) * 0.38];
    this.corDirecional = [1.0, 0.98, 0.9];
    this.intensidadeDirecional = 1.85;
    this.intensidadeAmbiente = 0.68;
    this.intensidadeEmissivo = 1;
    this.corFog = [
      0.08 + ciclo * 0.12,
      0.16 + ciclo * 0.18,
      0.13 + ciclo * 0.14,
    ];
    this.distanciaFog = 145;

    this.luzesPontuais = [];
    const limitePostes = Math.min(10, postes.length);
    for (let i = 0; i < limitePostes; i++) {
      const p = postes[i];
      this.luzesPontuais.push({
        posicao: [p[0], 3.5, p[2]],
        cor: i % 2 === 0 ? [0.2, 0.9, 1] : [1, 0.22, 0.7],
        intensidade: this.ligada ? 1.35 : 0,
      });
    }

    for (const luz of luzesVeiculo) {
      if (this.luzesPontuais.length >= 12) break;
      this.luzesPontuais.push({
        posicao: luz.posicao,
        cor: luz.cor,
        intensidade: this.ligada ? luz.intensidade * 0.65 : 0,
      });
    }
  }
}
