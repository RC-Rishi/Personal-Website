import { fragmentShader, vertexShader } from './shaders'
import type { RaysSettings } from './Rays'

export function createRaysRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
  if (!gl) throw new Error('WebGL unavailable')
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Rays shader allocation failed')
    gl.shaderSource(shader, source); gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Rays shader could not compile') }
    return shader
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexShader)
  let fragment: WebGLShader
  try { fragment = compile(gl.FRAGMENT_SHADER, fragmentShader) }
  catch (error) { gl.deleteShader(vertex); throw error }
  const program = gl.createProgram()
  if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); throw new Error('Rays program allocation failed') }
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program)
  gl.deleteShader(vertex); gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); throw new Error('Rays shader could not link') }
  const buffer = gl.createBuffer()
  if (!buffer) { gl.deleteProgram(program); throw new Error('Rays buffer allocation failed') }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.useProgram(program)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const uniforms = Object.fromEntries(['u_resolution', 'u_time', 'u_colors[0]', 'u_intensity', 'u_rays', 'u_reach', 'u_rayPos1', 'u_rayPos2'].map(name => [name, gl.getUniformLocation(program, name)]))
  const clamp = (v: number) => Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0)) / 100
  return {
    draw(settings: RaysSettings, time: number, width: number, height: number) {
      // Match the reference's 1x render resolution, independent of device DPR.
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(uniforms.u_resolution, width, height)
      gl.uniform1f(uniforms.u_time, time)
      gl.uniform1f(uniforms.u_intensity, clamp(settings.intensity) * .5)
      gl.uniform1f(uniforms.u_rays, clamp(settings.rays) * .3)
      gl.uniform1f(uniforms.u_reach, clamp(settings.reach) * .5)
      gl.uniform2f(uniforms.u_rayPos1, clamp(settings.position) * width, -.4 * height)
      gl.uniform2f(uniforms.u_rayPos2, (clamp(settings.position) + .02) * width, -.5 * height)
      const colors = settings.colors.map(color => {
        const hex = /^#[\da-f]{6}$/i.test(color) ? color : '#ffffff'
        return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255, 1]
      }).flat()
      gl.uniform4fv(uniforms['u_colors[0]'], colors)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    },
    dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program) },
  }
}
