#version 300 es
/*
  Vertex shader das particulas.
  Posiciona cada ponto de fumaca na tela e ajusta seu tamanho conforme a distancia.
*/

in vec4 position;
in vec4 color;
in float tamanho;

uniform mat4 u_view;
uniform mat4 u_projection;

out vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * position;
  gl_PointSize = tamanho / max(gl_Position.w, 0.35);
  v_color = color;
}
