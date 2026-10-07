// Active beam calculation adapted from the supplied Framer University Rays_Prod.
// Unused noise/color-space helpers have been omitted. See references/framer-rays.md.
export const vertexShader = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`
export const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_colors[2];
uniform float u_intensity;
uniform float u_rays;
uniform float u_reach;
uniform vec2 u_rayPos1;
uniform vec2 u_rayPos2;

float rayStrength(vec2 source, vec2 direction, vec2 coord, float seedA, float seedB, float speed) {
  vec2 delta = coord - source;
  float angle = dot(normalize(delta), direction);
  float diagonal = length(u_resolution);
  return clamp((.45 + .15 * sin(angle * seedA + u_time * speed)) +
    (.3 + .2 * cos(-angle * seedB + u_time * speed)), u_reach, 1.0) *
    clamp((diagonal - length(delta)) / diagonal, u_reach, 1.0);
}
void main() {
  vec2 coord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  float speed = u_rays * 10.0;
  float first = rayStrength(u_rayPos1, normalize(vec2(1.0, -.116)), coord, 36.2214 * speed, 21.11349 * speed, 1.5 * speed);
  float second = rayStrength(u_rayPos2, normalize(vec2(1.0, .241)), coord, 22.39910 * speed, 18.0234 * speed, 1.1 * speed);
  float attenuation = clamp(u_reach - coord.y / u_resolution.y + .5 + u_intensity, 0.0, 1.0);
  float alpha1 = first * attenuation * u_colors[0].a;
  float alpha2 = second * attenuation * u_colors[1].a;
  vec3 premultiplied = u_colors[0].rgb * alpha1 + u_colors[1].rgb * alpha2;
  float alpha = alpha1 + alpha2 * (1.0 - alpha1);
  gl_FragColor = vec4(premultiplied, alpha);
}
`
