#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.08, d);
  outColor = vec4(v_color.rgb, v_color.a * alpha);
}
