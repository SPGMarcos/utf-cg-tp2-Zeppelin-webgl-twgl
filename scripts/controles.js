export class Controles {
  constructor(canvas) {
    this.teclas = new Set();
    this.reiniciar();

    canvas.tabIndex = 0;
    canvas.focus();

    window.addEventListener("keydown", (e) => this.aoPressionar(e));
    window.addEventListener("keyup", (e) => this.teclas.delete(e.key.toLowerCase()));
    window.addEventListener("wheel", (e) => {
      this.zoomAereo = Math.max(0.55, Math.min(1.8, this.zoomAereo + Math.sign(e.deltaY) * 0.08));
    }, { passive: true });
  }

  reiniciar() {
    this.teclas.clear();
    this.camera = 1;
    this.lateral = 0;
    this.pousoAutomatico = false;
    this.olharCockpit = { yaw: 0, pitch: 0 };
    this.zoomAereo = 1;
    this.eventos = [];
  }

  aoPressionar(e) {
    const k = e.key.toLowerCase();
    if (k.startsWith("arrow")) e.preventDefault();
    this.teclas.add(k);
    if (e.repeat) return;

    if (k === "1") this.camera = 1;
    if (k === "2") this.camera = 2;
    if (k === "3") this.camera = 3;
    if (k === "c") this.lateral = (this.lateral + 1) % 4;
    if (k === "p") this.eventos.push("pouso");
    if (k === "l") this.eventos.push("luz");
    if (k === "n") this.eventos.push("fog");
  }

  atualizar(dt) {
    if (this.camera !== 3) return;

    // As setas ficam registradas em estado e a camera do cockpit responde a cada frame.
    const yawVelocidade = 1.65;
    const pitchVelocidade = 1.15;
    if (this.teclas.has("arrowleft")) this.olharCockpit.yaw += yawVelocidade * dt;
    if (this.teclas.has("arrowright")) this.olharCockpit.yaw -= yawVelocidade * dt;
    if (this.teclas.has("arrowup")) this.olharCockpit.pitch += pitchVelocidade * dt;
    if (this.teclas.has("arrowdown")) this.olharCockpit.pitch -= pitchVelocidade * dt;
    this.olharCockpit.pitch = Math.max(-0.5, Math.min(0.5, this.olharCockpit.pitch));
  }

  consumirEventos() {
    const eventos = this.eventos;
    this.eventos = [];
    return eventos;
  }

  eixoMovimento() {
    let frente = 0;
    let lado = 0;
    let vertical = 0;
    if (this.teclas.has("w")) frente += 1;
    if (this.teclas.has("s")) frente -= 1;
    if (this.teclas.has("d")) lado += 1;
    if (this.teclas.has("a")) lado -= 1;
    if (this.teclas.has("e")) vertical += 1;
    if (this.teclas.has("q")) vertical -= 1;
    return { frente, lado, vertical };
  }
}
