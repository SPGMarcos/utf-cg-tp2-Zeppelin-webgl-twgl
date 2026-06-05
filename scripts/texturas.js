/*
  Criacao e carregamento de texturas.
  Este modulo gera texturas procedurais em canvas e tambem carrega texturas
  externas dos kits de modelos usados na cena.
*/
function criarCanvasTextura(tamanho, desenho) {
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d");
  desenho(ctx, tamanho);
  return canvas;
}

function textura(gl, canvas, repetir = true) {
  return twgl.createTexture(gl, {
    src: canvas,
    mag: gl.LINEAR,
    min: gl.LINEAR_MIPMAP_LINEAR,
    wrapS: repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE,
    wrapT: repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE,
    auto: true,
  });
}

function texturaArquivo(gl, caminho) {
  return twgl.createTexture(gl, {
    src: caminho,
    mag: gl.NEAREST,
    min: gl.NEAREST_MIPMAP_LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });
}

export async function carregarTexturas(gl) {
  // Cria todas as texturas usadas pelos materiais do projeto.
  const branco = criarCanvasTextura(4, (ctx, t) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, t, t);
  });

  const chao = criarCanvasTextura(256, (ctx, t) => {
    ctx.fillStyle = "#24342f";
    ctx.fillRect(0, 0, t, t);
    ctx.fillStyle = "rgba(135,180,150,0.25)";
    for (let i = 0; i < 900; i++) {
      ctx.fillRect(Math.random() * t, Math.random() * t, 2, 2);
    }
  });

  const gramaLowPoly = criarCanvasTextura(256, (ctx, t) => {
    ctx.fillStyle = "#557c48";
    ctx.fillRect(0, 0, t, t);
    const cores = ["#6f9a58", "#4f7444", "#7faa61", "#5f8b50"];
    for (let y = 0; y < t; y += 32) {
      for (let x = 0; x < t; x += 32) {
        ctx.fillStyle = cores[((x / 32) + (y / 32) * 3) % cores.length];
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + 30, y);
        ctx.lineTo(x + 32, y + 28);
        ctx.lineTo(x + 5, y + 32);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.strokeStyle = "rgba(35,70,38,0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const x = (i * 41) % t;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo((x + 90) % t, t);
      ctx.stroke();
    }
  });

  const predio = criarCanvasTextura(256, (ctx, t) => {
    ctx.fillStyle = "#273142";
    ctx.fillRect(0, 0, t, t);
    for (let y = 16; y < t; y += 34) {
      for (let x = 16; x < t; x += 38) {
        ctx.fillStyle = (x + y) % 3 === 0 ? "#5cf2ff" : "#1c2532";
        ctx.fillRect(x, y, 14, 18);
      }
    }
  });

  const metal = criarCanvasTextura(256, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, t, t);
    g.addColorStop(0, "#8a6b45");
    g.addColorStop(0.5, "#e3bc72");
    g.addColorStop(1, "#4c3826");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, t, t);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    for (let x = 0; x < t; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 34, t);
      ctx.stroke();
    }
  });

  const heliporto = criarCanvasTextura(256, (ctx, t) => {
    ctx.fillStyle = "#20252c";
    ctx.fillRect(0, 0, t, t);
    ctx.strokeStyle = "#f0d78a";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(t / 2, t / 2, t * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 112px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f6e3a0";
    ctx.fillText("H", t / 2, t / 2 + 4);
  });

  const normalOndulada = criarCanvasTextura(128, (ctx, t) => {
    const img = ctx.createImageData(t, t);
    for (let y = 0; y < t; y++) {
      for (let x = 0; x < t; x++) {
        const h = Math.sin(x * 0.22) * Math.cos(y * 0.18);
        const i = (y * t + x) * 4;
        img.data[i] = 128 + h * 45;
        img.data[i + 1] = 128 - h * 35;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });

  return {
    branco: textura(gl, branco),
    ruas: texturaArquivo(gl, "./assets/modelos/Ruas/Textures/colormap.png"),
    gramaLowPoly: textura(gl, gramaLowPoly),
    chao: textura(gl, chao),
    predio: textura(gl, predio),
    metal: textura(gl, metal),
    heliporto: textura(gl, heliporto),
    normalOndulada: textura(gl, normalOndulada),
  };
}
