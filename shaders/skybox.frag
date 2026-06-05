#version 300 es
precision highp float;

in vec3 v_direcao;

uniform samplerCube u_skybox;

out vec4 outColor;

void main() {
  outColor = texture(u_skybox, normalize(v_direcao));
}
