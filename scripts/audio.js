/*
  Sistema de audio da simulacao.
  Este modulo inicializa a musica, o som do motor e um som sutil de vento,
  ajustando os efeitos de acordo com velocidade e altitude do navio.
*/
const CAMINHO_MUSICA = "./assets/audio/Chubina (Slowed) - East Duo (youtube).mp3";
const CAMINHO_MOTOR = "./assets/audio/freesound_community-zeppelin-motor-75040.mp3";
const VOLUME_MUSICA = 0.030;
const VOLUME_MOTOR = 0.065;

export class SistemaAudio {
  constructor() {
    this.ctx = null;
    this.audioMusica = null;
    this.fonteMusica = null;
    this.fontesMotor = [];
    this.bufferMotor = null;
    this.filtroMotor = null;
    this.compressorMotor = null;
    this.ganhoMotor = null;
    this.vento = null;
    this.ganhoVento = null;
    this.ganhoMusica = null;
    this.pitchMotorAtual = 1;
    this.carregandoMotor = false;
    this.iniciado = false;
  }

  // Cria os elementos de audio apenas depois de uma interacao do usuario.
  iniciarComInteracao() {
    if (this.iniciado) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.ctx.resume?.();

    this.ganhoMotor = this.ctx.createGain();
    this.ganhoMotor.gain.value = VOLUME_MOTOR;

    this.filtroMotor = this.ctx.createBiquadFilter();
    this.filtroMotor.type = "lowpass";
    this.filtroMotor.frequency.value = 3000;
    this.filtroMotor.Q.value = 0.55;

    this.compressorMotor = this.ctx.createDynamicsCompressor();
    this.compressorMotor.threshold.value = -30;
    this.compressorMotor.knee.value = 18;
    this.compressorMotor.ratio.value = 10;
    this.compressorMotor.attack.value = 0.018;
    this.compressorMotor.release.value = 0.022;
    this.filtroMotor.connect(this.compressorMotor).connect(this.ganhoMotor).connect(this.ctx.destination);

    this.audioMusica = new Audio(CAMINHO_MUSICA);
    this.audioMusica.loop = true;
    this.audioMusica.preload = "auto";
    this.audioMusica.volume = 1;
    this.fonteMusica = this.ctx.createMediaElementSource(this.audioMusica);
    this.ganhoMusica = this.ctx.createGain();
    this.ganhoMusica.gain.value = VOLUME_MUSICA;
    this.fonteMusica.connect(this.ganhoMusica).connect(this.ctx.destination);

    this.vento = this.ctx.createOscillator();
    this.vento.type = "sine";
    this.vento.frequency.value = 90;
    this.ganhoVento = this.ctx.createGain();
    this.ganhoVento.gain.value = 0;
    this.vento.connect(this.ganhoVento).connect(this.ctx.destination);
    this.vento.start();

    this.iniciado = true;
    this.iniciarMotorEmLoop();
    this.audioMusica.play().catch(() => {});
  }

  async carregarBuffer(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error(`Falha ao carregar audio: ${caminho}`);
    const dados = await resposta.arrayBuffer();
    return this.ctx.decodeAudioData(dados);
  }

  async iniciarMotorEmLoop() {
    // Usa duas fontes do mesmo audio para deixar o motor em loop sem cortes bruscos.
    if (this.carregandoMotor || this.fontesMotor.length || !this.ctx) return;
    this.carregandoMotor = true;
    try {
      const buffer = await this.carregarBuffer(CAMINHO_MOTOR);
      if (!this.iniciado || !this.ctx) return;
      this.bufferMotor = buffer;
      this.iniciarFonteMotor(0);
      this.iniciarFonteMotor(buffer.duration * 0.5);
    } catch (erro) {
      console.warn(erro);
    } finally {
      this.carregandoMotor = false;
    }
  }

  iniciarFonteMotor(offset) {
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.bufferMotor;
    fonte.loop = true;
    fonte.loopStart = Math.min(0.08, this.bufferMotor.duration * 0.08);
    fonte.loopEnd = Math.max(fonte.loopStart + 0.2, this.bufferMotor.duration - 0.08);
    fonte.playbackRate.value = this.pitchMotorAtual;
    fonte.connect(this.filtroMotor);
    fonte.start(0, Math.min(offset, fonte.loopEnd - 0.02));
    this.fontesMotor.push(fonte);
  }

  atualizar(estado) {
    // Atualiza pitch e filtros do motor conforme o estado atual do voo.
    if (!this.iniciado || !this.ctx) return;
    this.ctx.resume?.();

    const velocidade = Math.abs(estado.velocidade || 0);
    const altitude = estado.altitude || 0;
    const rpm = Math.min(1, velocidade / 16);
    const vento = Math.min(1, Math.max(0, (altitude - 12) / 22));
    const pitchAlvo = 0.94 + rpm * 0.18;
    this.pitchMotorAtual += (pitchAlvo - this.pitchMotorAtual) * 0.08;

    if (!this.fontesMotor.length) this.iniciarMotorEmLoop();
    for (const fonte of this.fontesMotor) {
      fonte.playbackRate.setTargetAtTime(this.pitchMotorAtual, this.ctx.currentTime, 0.18);
    }
    this.filtroMotor.frequency.setTargetAtTime(2800 + rpm * 1600, this.ctx.currentTime, 0.24);
    this.ganhoMotor.gain.setTargetAtTime(VOLUME_MOTOR, this.ctx.currentTime, 0.8);
    this.vento.frequency.setTargetAtTime(70 + vento * 35, this.ctx.currentTime, 0.8);
    this.ganhoVento.gain.setTargetAtTime(vento * 0.0015, this.ctx.currentTime, 0.9);
  }
}
