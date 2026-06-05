#version 300 es
/*
  Fragment shader da skybox.
  Amostra a textura cubemap e aplica um tom suave para compor o fundo da cena.
*/
precision highp float;

in vec3 v_direcao;

uniform samplerCube u_skybox;

out vec4 outColor;

void main() {
  outColor = texture(u_skybox, normalize(v_direcao));
}
