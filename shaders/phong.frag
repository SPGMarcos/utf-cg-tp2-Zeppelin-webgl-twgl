#version 300 es
/*
  Fragment shader principal.
  Calcula a cor final dos objetos usando textura, modelo de iluminacao Phong,
  luzes pontuais, material emissivo, transparencia e neblina.
*/
precision highp float;

struct LuzPontual {
  vec3 posicao;
  vec3 cor;
  float intensidade;
};

in vec3 v_posicaoMundo;
in vec3 v_normal;
in vec2 v_uv;
in vec3 v_tangente;

uniform vec3 u_cameraPosition;
uniform vec3 u_luzDirecional;
uniform vec3 u_corLuzDirecional;
uniform float u_intensidadeDirecional;
uniform bool u_modeloPhongAtivo;
uniform bool u_fogLigado;
uniform vec3 u_corFog;
uniform float u_distanciaFog;
uniform float u_tempo;

uniform sampler2D u_diffuse;
uniform sampler2D u_normalMap;
uniform vec4 u_corBase;
uniform vec3 u_emissivo;
uniform float u_intensidadeAmbiente;
uniform float u_intensidadeEmissivo;
uniform float u_usarTextura;
uniform float u_usarNormalMap;
uniform float u_shininess;
uniform float u_intensidadeEspecular;
uniform float u_alpha;
uniform float u_pulsoNeon;

uniform LuzPontual u_luzesPontuais[12];
uniform int u_totalLuzesPontuais;

out vec4 outColor;

vec3 normalComMapa() {
  vec3 n = normalize(v_normal);
  if (u_usarNormalMap < 0.5) {
    return n;
  }

  vec3 t = normalize(v_tangente - n * dot(v_tangente, n));
  vec3 b = normalize(cross(n, t));
  mat3 tbn = mat3(t, b, n);
  vec3 amostra = texture(u_normalMap, v_uv * 6.0).xyz * 2.0 - 1.0;
  return normalize(tbn * amostra);
}

vec3 phong(vec3 normalFinal, vec3 corMaterial) {
  vec3 n = normalize(normalFinal);
  vec3 viewDir = normalize(u_cameraPosition - v_posicaoMundo);
  // Soma ambiente, difuso e especular para formar a iluminacao Phong.
  vec3 ambiente = u_intensidadeAmbiente * corMaterial;
  vec3 acumulada = ambiente;

  vec3 dirLuz = normalize(-u_luzDirecional);
  float dif = max(dot(n, dirLuz), 0.0);
  vec3 meio = normalize(dirLuz + viewDir);
  float spec = pow(max(dot(n, meio), 0.0), u_shininess) * u_intensidadeEspecular;
  acumulada += (dif * corMaterial + spec * vec3(0.9)) * u_corLuzDirecional * u_intensidadeDirecional;

  for (int i = 0; i < 12; i++) {
    if (i >= u_totalLuzesPontuais) {
      break;
    }
    vec3 paraLuz = u_luzesPontuais[i].posicao - v_posicaoMundo;
    float distancia = length(paraLuz);
    vec3 l = normalize(paraLuz);
    float atenuacao = 1.0 / (1.0 + 0.07 * distancia + 0.018 * distancia * distancia);
    float difPontual = max(dot(n, l), 0.0);
    vec3 meioPontual = normalize(l + viewDir);
    float specPontual = pow(max(dot(n, meioPontual), 0.0), u_shininess) * u_intensidadeEspecular;
    acumulada += (difPontual * corMaterial + specPontual * vec3(0.85)) *
      u_luzesPontuais[i].cor * u_luzesPontuais[i].intensidade * atenuacao;
  }

  float pulsoSuave = 0.86 + 0.14 * sin(u_tempo * 1.35 + u_pulsoNeon);
  vec3 emissivoFinal = u_emissivo * u_intensidadeEmissivo;
  vec3 bloomFake = emissivoFinal * emissivoFinal * 0.22;
  return acumulada + emissivoFinal * pulsoSuave + bloomFake;
}

void main() {
  vec4 texel = texture(u_diffuse, v_uv);
  vec4 base = mix(u_corBase, texel * u_corBase, u_usarTextura);
  vec3 cor = u_modeloPhongAtivo
    ? phong(normalComMapa(), base.rgb)
    : base.rgb + u_emissivo * 0.18;

  if (u_fogLigado) {
    float d = distance(u_cameraPosition, v_posicaoMundo);
    float densidade = 1.7 / max(u_distanciaFog, 1.0);
    float fatorFog = 1.0 - exp(-d * densidade);
    fatorFog = smoothstep(0.12, 0.92, fatorFog);
    cor = mix(cor, u_corFog, fatorFog);
  }

  cor = cor / (cor + vec3(1.0));
  outColor = vec4(cor, base.a * u_alpha);
}
