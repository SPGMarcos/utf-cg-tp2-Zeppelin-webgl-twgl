export function calcularCorCeu(tempo) {
  const ciclo = (Math.sin(tempo * 0.055) + 1) * 0.5;
  return [
    0.48 + ciclo * 0.10,
    0.68 + ciclo * 0.12,
    0.92 + ciclo * 0.06,
  ];
}

export function atualizarStatusCamera(elemento, nomeCamera, navio, luz, fog) {
  if (!elemento) return;
  const altitude = navio.posicao[1].toFixed(1).replace(".", ",");
  const distancia = Math.hypot(navio.posicao[0], navio.posicao[2]).toFixed(0);
  const statusCamera = nomeCamera.replace(/ - (.)/, (_, letra) => ` - ${letra.toLocaleUpperCase("pt-BR")}`);
  elemento.replaceChildren(
    `${statusCamera} | Alt. ${altitude} | Dist. ${distancia}`,
    document.createElement("br"),
    `Phong: ${luz ? "Ligada" : "Desligada"} | Fog: ${fog ? "Ligada" : "Desligada"}`,
  );
}
