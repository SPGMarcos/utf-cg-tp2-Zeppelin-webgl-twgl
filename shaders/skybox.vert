#version 300 es
/*
  Vertex shader da skybox.
  Desenha o cubo de fundo sem deslocamento da camera para simular um ceu distante.
*/
precision highp float;

in vec4 position;

uniform mat4 u_viewSemTranslacao;
uniform mat4 u_projection;

out vec3 v_direcao;

void main() {
  v_direcao = position.xyz;
  vec4 pos = u_projection * u_viewSemTranslacao * position;
  gl_Position = pos.xyww;
}
