/*
  Carregamento de shaders WebGL.
  Este modulo busca os arquivos GLSL e cria programas prontos para serem usados
  pelo TWGL durante a renderizacao.
*/
export async function carregarPrograma(gl, caminhoVert, caminhoFrag) {
  const [vert, frag] = await Promise.all([
    fetch(caminhoVert).then((r) => r.text()),
    fetch(caminhoFrag).then((r) => r.text()),
  ]);
  return twgl.createProgramInfo(gl, [vert, frag]);
}
