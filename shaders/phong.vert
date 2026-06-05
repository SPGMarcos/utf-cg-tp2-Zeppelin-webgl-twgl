#version 300 es
/*
  Vertex shader principal.
  Transforma cada vertice para o espaco de mundo e envia normal, UV e tangente
  para o fragment shader calcular textura, iluminacao e normal map.
*/

in vec4 position;
in vec3 normal;
in vec2 texcoord;
in vec3 tangent;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_worldInverseTranspose;

out vec3 v_posicaoMundo;
out vec3 v_normal;
out vec2 v_uv;
out vec3 v_tangente;

void main() {
  vec4 posicaoMundo = u_world * position;
  v_posicaoMundo = posicaoMundo.xyz;
  v_normal = mat3(u_worldInverseTranspose) * normal;
  v_tangente = mat3(u_world) * tangent;
  v_uv = texcoord;
  gl_Position = u_projection * u_view * posicaoMundo;
}
