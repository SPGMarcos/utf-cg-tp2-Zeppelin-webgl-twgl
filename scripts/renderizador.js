import { carregarPrograma } from "./shaders.js";

export class Renderizador {
  constructor(gl) {
    this.gl = gl;
    this.programa = null;
    this.programaSkybox = null;
    this.texturaSkybox = null;
    this.programaParticulas = null;
    this.geometrias = new Map();
  }

  async iniciar() {
    const gl = this.gl;
    this.programa = await carregarPrograma(gl, "./shaders/phong.vert", "./shaders/phong.frag");
    this.programaSkybox = await carregarPrograma(gl, "./shaders/skybox.vert", "./shaders/skybox.frag");
    this.texturaSkybox = await this.carregarSkybox("./assets/skybox/envmap_interstellar");
    this.programaParticulas = await carregarPrograma(gl, "./shaders/particulas.vert", "./shaders/particulas.frag");
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.02, 0.03, 0.06, 1);
  }

  carregarImagem(caminho) {
    return new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => resolve(imagem);
      imagem.onerror = () => reject(new Error(`Falha ao carregar skybox: ${caminho}`));
      imagem.src = caminho;
    });
  }

  async carregarSkybox(base) {
    const gl = this.gl;
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, textura);
    const faces = [
      [gl.TEXTURE_CUBE_MAP_POSITIVE_X, `${base}/interstellar_rt.png`],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, `${base}/interstellar_lf.png`],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, `${base}/interstellar_up.png`],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, `${base}/interstellar_dn.png`],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, `${base}/interstellar_bk.png`],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, `${base}/interstellar_ft.png`],
    ];

    for (const [alvo] of faces) {
      gl.texImage2D(alvo, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([120, 145, 160, 255]));
    }

    const imagens = await Promise.all(faces.map(([, caminho]) => this.carregarImagem(caminho)));
    for (let i = 0; i < faces.length; i++) {
      gl.texImage2D(faces[i][0], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagens[i]);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    return textura;
  }

  registrarGeometria(nome, arrays) {
    const gl = this.gl;
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vaoInfo = twgl.createVertexArrayInfo(gl, this.programa, bufferInfo);
    this.geometrias.set(nome, { bufferInfo, vaoInfo });
  }

  redimensionar() {
    twgl.resizeCanvasToDisplaySize(this.gl.canvas, window.devicePixelRatio || 1);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  limpar(corCeu) {
    const gl = this.gl;
    gl.clearColor(corCeu[0], corCeu[1], corCeu[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  desenharObjetos(objetos, contexto) {
    const opacos = [];
    const transparentes = [];
    for (const obj of objetos) {
      const mat = contexto.materiais[obj.material];
      const alpha = obj.alpha ?? mat.alpha ?? mat.cor?.[3] ?? 1;
      if (alpha < 0.98) transparentes.push(obj);
      else opacos.push(obj);
    }
    for (const obj of opacos) this.desenharObjeto(obj, contexto);
    // Vidro e hologramas precisam entrar depois dos opacos para o alpha blending funcionar.
    transparentes.sort((a, b) => {
      const da = Math.hypot(a.posicaoReferencia[0] - contexto.cameraPosition[0], a.posicaoReferencia[1] - contexto.cameraPosition[1], a.posicaoReferencia[2] - contexto.cameraPosition[2]);
      const db = Math.hypot(b.posicaoReferencia[0] - contexto.cameraPosition[0], b.posicaoReferencia[1] - contexto.cameraPosition[1], b.posicaoReferencia[2] - contexto.cameraPosition[2]);
      return db - da;
    });
    for (const obj of transparentes) this.desenharObjeto(obj, contexto, true);
  }

  desenharSkybox(contexto) {
    const gl = this.gl;
    const geo = this.geometrias.get("cubo");
    if (!geo || !this.texturaSkybox) return;

    const viewSemTranslacao = [...contexto.view];
    viewSemTranslacao[12] = 0;
    viewSemTranslacao[13] = 0;
    viewSemTranslacao[14] = 0;

    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.programaSkybox.program);
    twgl.setUniforms(this.programaSkybox, {
      u_viewSemTranslacao: viewSemTranslacao,
      u_projection: contexto.projection,
      u_skybox: this.texturaSkybox,
    });
    twgl.setBuffersAndAttributes(gl, this.programaSkybox, geo.bufferInfo);
    twgl.drawBufferInfo(gl, geo.bufferInfo);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
  }

  desenharObjeto(obj, contexto, transparente = false) {
    const gl = this.gl;
    const geo = this.geometrias.get(obj.geometria);
    if (!geo) return;

    const material = contexto.materiais[obj.material];
    const corBase = material.cor;
    const emissivo = material.emissivoDia || material.emissivo || [0, 0, 0];
    // A matriz normal corrige as normais quando o objeto tem escala nao uniforme.
    const normal = twgl.m4.transpose(twgl.m4.inverse(obj.matriz));
    const uniforms = {
      u_world: obj.matriz,
      u_view: contexto.view,
      u_projection: contexto.projection,
      u_worldInverseTranspose: normal,
      u_cameraPosition: contexto.cameraPosition,
      u_luzDirecional: contexto.iluminacao.direcao,
      u_corLuzDirecional: contexto.iluminacao.corDirecional,
      u_intensidadeDirecional: contexto.iluminacao.intensidadeDirecional,
      u_modeloPhongAtivo: contexto.iluminacao.ligada,
      u_fogLigado: contexto.iluminacao.fogLigado,
      u_corFog: contexto.iluminacao.corFog,
      u_distanciaFog: contexto.distanciaFog ?? contexto.iluminacao.distanciaFog,
      u_tempo: contexto.tempo,
      u_diffuse: material.textura,
      u_normalMap: material.normalMap || contexto.texturas.branco,
      u_corBase: corBase,
      u_emissivo: emissivo,
      u_intensidadeAmbiente: contexto.iluminacao.intensidadeAmbiente,
      u_intensidadeEmissivo: contexto.iluminacao.intensidadeEmissivo,
      u_usarTextura: material.textura ? 1 : 0,
      u_usarNormalMap: material.usarNormalMap || 0,
      u_shininess: material.shininess || 24,
      u_intensidadeEspecular: material.especular ?? 1,
      u_alpha: obj.alpha ?? material.alpha ?? 1,
      u_pulsoNeon: material.pulso || 0,
      u_totalLuzesPontuais: contexto.iluminacao.luzesPontuais.length,
    };

    for (let i = 0; i < 12; i++) {
      const luz = contexto.iluminacao.luzesPontuais[i] || { posicao: [0, 0, 0], cor: [0, 0, 0], intensidade: 0 };
      uniforms[`u_luzesPontuais[${i}].posicao`] = luz.posicao;
      uniforms[`u_luzesPontuais[${i}].cor`] = luz.cor;
      uniforms[`u_luzesPontuais[${i}].intensidade`] = luz.intensidade;
    }

    gl.useProgram(this.programa.program);
    if (obj.duplaFace) gl.disable(gl.CULL_FACE);
    if (transparente) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
    }
    twgl.setUniforms(this.programa, uniforms);
    twgl.setBuffersAndAttributes(gl, this.programa, geo.vaoInfo);
    twgl.drawBufferInfo(gl, geo.vaoInfo);
    if (obj.duplaFace) gl.enable(gl.CULL_FACE);
    if (transparente) {
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
  }
}
