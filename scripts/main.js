import { Renderizador } from "./renderizador.js";
import { carregarTexturas } from "./texturas.js";
import { criarMateriais } from "./materiais.js";
import { criarCubo, criarPlano, criarCilindro, criarEsfera } from "./geometria/primitivas.js";
import { carregarOBJ } from "./util/carregadorObj.js";
import { Controles } from "./controles.js";
import { Cameras } from "./cameras.js";
import { SistemaIluminacao } from "./iluminacao.js";
import { Cidade } from "./cidade.js";
import { Navio } from "./objetoVoador.js";
import { SistemaParticulas } from "./particulas.js";
import { SistemaAudio } from "./audio.js";
import { calcularCorCeu, atualizarStatusCamera } from "./animacoes.js";

const canvas = document.querySelector("#tela-cg");
const aviso = document.querySelector("#aviso-carregamento");
const statusCamera = document.querySelector("#status-camera");
const telaInicio = document.querySelector("#tela-inicio");
const botaoIniciar = document.querySelector("#botao-iniciar");
const botaoReiniciar = document.querySelector("#botao-reiniciar");
const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
const audio = new SistemaAudio();

if (!gl) {
  aviso.classList.remove("oculto");
  aviso.textContent = "Este navegador nao oferece WebGL2.";
  throw new Error("WebGL2 indisponivel");
}

async function iniciar() {
  const renderizador = new Renderizador(gl);
  await renderizador.iniciar();

  renderizador.registrarGeometria("cubo", criarCubo());
  renderizador.registrarGeometria("plano", criarPlano(1, 18));
  renderizador.registrarGeometria("cilindro", criarCilindro(28));
  renderizador.registrarGeometria("esfera", criarEsfera(18, 36));

  const modelos = {
    "kit_ship_pirate": "./assets/modelos/Navio/ship-pirate-large.obj",
    "kit_mast": "./assets/modelos/Navio/mast.obj",
    "kit_mast_ropes": "./assets/modelos/Navio/mast-ropes.obj",
    "kit_cannon": "./assets/modelos/Navio/cannon.obj",
    "kit_anchor": "./assets/modelos/Navio/tool-paddle.obj",
    "kit_building_a": "./assets/modelos/Predios/building-a.obj",
    "kit_building_b": "./assets/modelos/Predios/building-b.obj",
    "kit_building_e": "./assets/modelos/Predios/building-e.obj",
    "kit_building_h": "./assets/modelos/Predios/building-h.obj",
    "kit_building_k": "./assets/modelos/Predios/building-k.obj",
    "kit_building_l": "./assets/modelos/Predios/building-l.obj",
    "kit_building_m": "./assets/modelos/Predios/building-m.obj",
    "kit_low_building_h": "./assets/modelos/Predios/low-detail-building-h.obj",
    "kit_low_building_wide": "./assets/modelos/Predios/low-detail-building-wide-a.obj",
    "kit_skyscraper_a": "./assets/modelos/Predios/building-skyscraper-a.obj",
    "kit_skyscraper_c": "./assets/modelos/Predios/building-skyscraper-c.obj",
    "kit_industrial_r": "./assets/modelos/ZepellinPorto/building-r.obj",
    "kit_industrial_t": "./assets/modelos/ZepellinPorto/building-t.obj",
    "kit_chimney": "./assets/modelos/ZepellinPorto/chimney-large.obj",
    "kit_tank": "./assets/modelos/ZepellinPorto/detail-tank.obj",
    "kit_road_straight": "./assets/modelos/Ruas/road-straight.obj",
    "kit_road_cross": "./assets/modelos/Ruas/road-crossroad.obj",
    "kit_road_cross_line": "./assets/modelos/Ruas/road-crossroad-line.obj",
    "kit_road_bend": "./assets/modelos/Ruas/road-bend.obj",
    "kit_light_curved": "./assets/modelos/Decoracoes/light-curved.obj",
    "kit_construction_barrier": "./assets/modelos/Decoracoes/construction-barrier.obj",
    "kit_construction_light": "./assets/modelos/Decoracoes/construction-light.obj",
    "nature_tree_default": "./assets/modelos/Natureza/tree_default.obj",
    "nature_tree_oak": "./assets/modelos/Natureza/tree_oak.obj",
    "nature_tree_pine": "./assets/modelos/Natureza/tree_pineDefaultA.obj",
    "nature_bush": "./assets/modelos/Natureza/plant_bush.obj",
    "nature_bush_small": "./assets/modelos/Natureza/plant_bushSmall.obj",
    "nature_grass": "./assets/modelos/Natureza/grass_large.obj",
    "nature_rock_small": "./assets/modelos/Natureza/rock_smallA.obj",
    "kit_sedan": "./assets/modelos/Veiculos/sedan.obj",
    "kit_taxi": "./assets/modelos/Veiculos/taxi.obj",
    "kit_van": "./assets/modelos/Veiculos/van.obj",
    "kit_car_sport": "./assets/modelos/Veiculos/sedan-sports.obj",
    "kit_car_suv": "./assets/modelos/Veiculos/suv.obj",
    "kit_car_race": "./assets/modelos/Veiculos/race.obj",
    "kit_car_police": "./assets/modelos/Veiculos/police.obj",
    "kit_car_ambulance": "./assets/modelos/Veiculos/ambulance.obj",
    "kit_car_truck": "./assets/modelos/Veiculos/truck.obj",
  };

  await Promise.all(Object.entries(modelos).map(async ([nome, caminho]) => {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error(`Falha ao carregar modelo: ${caminho}`);
    renderizador.registrarGeometria(nome, carregarOBJ(await resposta.text()));
  }));

  const texturas = await carregarTexturas(gl);
  const materiais = criarMateriais(texturas);
  const controles = new Controles(canvas);
  const cameras = new Cameras();
  const iluminacao = new SistemaIluminacao();
  const cidade = new Cidade();
  const navio = new Navio();
  const particulas = new SistemaParticulas(gl, renderizador.programaParticulas);
  window.addEventListener("keydown", () => audio.iniciarComInteracao(), { once: true });
  aviso.classList.add("oculto");
  telaInicio.classList.add("oculto");
  document.body.classList.add("simulacao-iniciada");
  canvas.focus();

  let anterior = performance.now();
  function quadro(agora) {
    const tempo = agora * 0.001;
    const dt = Math.min(0.033, (agora - anterior) * 0.001);
    anterior = agora;

    for (const evento of controles.consumirEventos()) {
      if (evento === "luz") iluminacao.alternarLuz();
      if (evento === "fog") iluminacao.alternarFog();
      if (evento === "pouso") navio.alternarPouso(controles, cidade);
    }

    controles.atualizar(dt);
    navio.atualizar(dt, controles, cidade);
    cidade.atualizar(dt, tempo);
    particulas.atualizar(dt, navio);
    const objetosNavio = navio.objetos();
    iluminacao.atualizar(tempo, cidade.postes, navio.luzes);
    audio.atualizar({
      velocidade: navio.velocidade,
      altitude: navio.posicao[1],
      noSolo: navio.noSolo,
      colidiu: navio.colidiu,
    });

    renderizador.redimensionar();
    const camera = cameras.calcular(gl, navio, controles, tempo);
    renderizador.limpar(calcularCorCeu(tempo));
    renderizador.desenharSkybox({
      view: camera.view,
      projection: camera.projection,
    });

    const objetos = [
      ...cidade.objetos(camera.cameraPosition, tempo),
      ...objetosNavio,
    ];

    renderizador.desenharObjetos(objetos, {
      view: camera.view,
      projection: camera.projection,
      cameraPosition: camera.cameraPosition,
      iluminacao,
      distanciaFog: controles.camera === 2 ? 90 : controles.camera === 3 ? 85 : iluminacao.distanciaFog,
      materiais,
      texturas,
      tempo,
    });
    particulas.desenhar(camera.view, camera.projection);
    atualizarStatusCamera(statusCamera, camera.nome, navio, iluminacao.ligada, iluminacao.fogLigado);
    requestAnimationFrame(quadro);
  }

  requestAnimationFrame(quadro);
}

let iniciou = false;

function mostrarTelaInicio() {
  telaInicio.classList.remove("oculto");
  document.body.classList.remove("simulacao-iniciada");
  aviso.classList.add("oculto");
  botaoIniciar.disabled = false;
  botaoIniciar.textContent = "Retomar Simulação";
}

function ocultarTelaInicio() {
  telaInicio.classList.add("oculto");
  document.body.classList.add("simulacao-iniciada");
  canvas.focus();
}

function iniciarSimulacao() {
  if (iniciou) {
    ocultarTelaInicio();
    return;
  }
  iniciou = true;
  audio.iniciarComInteracao();
  botaoIniciar.disabled = true;
  botaoIniciar.textContent = "Carregando...";
  aviso.textContent = "Carregando shaders, texturas e modelos...";
  aviso.classList.remove("oculto");

  iniciar().then(() => {
    botaoIniciar.disabled = false;
    botaoReiniciar.classList.remove("oculto");
    botaoIniciar.textContent = "Retomar Simulação";
  }).catch((erro) => {
    console.error(erro);
    aviso.textContent = "Falha ao iniciar o projeto. Use Live Server e confira o console.";
    botaoIniciar.disabled = false;
    botaoIniciar.textContent = "Iniciar Simulação";
    iniciou = false;
  });
}

botaoIniciar.addEventListener("click", iniciarSimulacao);
botaoReiniciar.addEventListener("click", () => {
  window.location.reload();
});

window.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && iniciou) {
    mostrarTelaInicio();
    return;
  }
  if (iniciou) return;
  if (evento.key === "Enter") iniciarSimulacao();
});
