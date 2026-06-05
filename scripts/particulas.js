export class SistemaParticulas {
  constructor(gl, programa, maximo = 420) {
    this.gl = gl;
    this.programa = programa;
    this.maximo = maximo;
    this.particulas = [];
    this.posicoes = new Float32Array(maximo * 3);
    this.cores = new Float32Array(maximo * 4);
    this.tamanhos = new Float32Array(maximo);
    this.vao = gl.createVertexArray();
    this.buffers = {
      position: gl.createBuffer(),
      color: gl.createBuffer(),
      tamanho: gl.createBuffer(),
    };
    this.iniciarBuffers();
  }

  iniciarBuffers() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    const atributos = [
      ["position", this.buffers.position, 3, this.posicoes.byteLength],
      ["color", this.buffers.color, 4, this.cores.byteLength],
      ["tamanho", this.buffers.tamanho, 1, this.tamanhos.byteLength],
    ];

    for (const [nome, buffer, componentes, bytes] of atributos) {
      const loc = gl.getAttribLocation(this.programa.program, nome);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, componentes, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
  }

  emitir(posicao, velocidade, cor, vida, tamanho) {
    if (this.particulas.length >= this.maximo) this.particulas.shift();
    this.particulas.push({
      p: [...posicao],
      v: [...velocidade],
      cor: [...cor],
      vida,
      vidaInicial: vida,
      tamanho,
    });
  }

  atualizar(dt, navio) {
    const yaw = navio.rotacaoY;
    const tras = [-Math.sin(yaw), 0, -Math.cos(yaw)];
    const lateral = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const base = navio.posicao;
    for (let i = 0; i < 4; i++) {
      const lado = i % 2 === 0 ? 1 : -1;
      const origem = [
        base[0] + tras[0] * 4.8 + lateral[0] * lado * 1.45,
        base[1] - 0.15 + Math.random() * 0.12,
        base[2] + tras[2] * 4.8 + lateral[2] * lado * 1.45,
      ];
      this.emitir(origem, [
        tras[0] * (1.8 + Math.random()),
        -0.15 + Math.random() * 0.35,
        tras[2] * (1.8 + Math.random()),
      ], [0.78, 0.84, 0.9, 0.55], 1.2 + Math.random() * 0.8, 38 + Math.random() * 20);
    }

    for (const p of this.particulas) {
      p.vida -= dt;
      p.p[0] += p.v[0] * dt;
      p.p[1] += p.v[1] * dt;
      p.p[2] += p.v[2] * dt;
      p.v[1] += 0.16 * dt;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
  }

  desenhar(view, projection) {
    const gl = this.gl;
    const total = this.particulas.length;
    for (let i = 0; i < total; i++) {
      const p = this.particulas[i];
      const a = Math.max(0, p.vida / p.vidaInicial);
      this.posicoes.set(p.p, i * 3);
      this.cores.set([p.cor[0], p.cor[1], p.cor[2], p.cor[3] * a], i * 4);
      this.tamanhos[i] = p.tamanho * (1.2 - a * 0.25);
    }

    gl.useProgram(this.programa.program);
    twgl.setUniforms(this.programa, { u_view: view, u_projection: projection });
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.posicoes.subarray(0, total * 3));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.cores.subarray(0, total * 4));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.tamanho);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tamanhos.subarray(0, total));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, total);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }
}
