export async function carregarPrograma(gl, caminhoVert, caminhoFrag) {
  const [vert, frag] = await Promise.all([
    fetch(caminhoVert).then((r) => r.text()),
    fetch(caminhoFrag).then((r) => r.text()),
  ]);
  return twgl.createProgramInfo(gl, [vert, frag]);
}
