// Interim "living portrait" for Wren: gently warps the single illustration in WebGL so she sways,
// breathes, tilts her head, and her hair moves. The mouth and blink frames are painted into the
// texture first, so they move with her. Replaced later by a proper Rive/Live2D rig.
//
// Coordinates are in the 800x800 crop of wren-scene.webp (source x+250, y+40). Her hand rests on her
// chin, so the head region includes the hand and head motion stays very small.

import type { AvatarState } from "@/components/Avatar";

const CROP = { x: 250, y: 40, size: 800 };
const MOUTH = { x: 618, y: 395, w: 132, h: 95 };
const EYES = { x: 560, y: 290, w: 215, h: 88 };

const VERT = `
attribute vec2 pos;
varying vec2 vUv;
void main() {
  vUv = vec2(pos.x * 0.5 + 0.5, 0.5 - pos.y * 0.5); // y down, like the image
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

// Inverse warp: for each output pixel, find where to sample in the (composited) illustration.
const FRAG = `
precision highp float;
uniform sampler2D tex;
uniform float bodyA;   // whole-figure sway (radians), pivot below the frame
uniform float headA;   // head + hand tilt (radians), pivot at the neck
uniform float headDy;  // head nod (px, down)
uniform float breath;  // chest scale
uniform float hairX;   // hair sway amplitude (px)
uniform float t;
varying vec2 vUv;

// 1 inside the ellipse, smooth falloff to 0 at its edge.
float ell(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return 1.0 - smoothstep(0.45, 1.0, dot(d, d));
}
vec2 rot(vec2 p, vec2 pivot, float a) {
  float c = cos(a), s = sin(a);
  vec2 d = p - pivot;
  return pivot + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
}
void main() {
  vec2 p = vUv * 800.0;
  float wb = ell(p, vec2(420.0, 500.0), vec2(340.0, 540.0));
  p = rot(p, vec2(420.0, 950.0), -bodyA * wb);
  float wh = ell(p, vec2(425.0, 300.0), vec2(235.0, 275.0));
  p = rot(p, vec2(440.0, 560.0), -headA * wh);
  p.y -= headDy * wh;
  float wc = ell(p, vec2(420.0, 700.0), vec2(300.0, 170.0));
  p.y = 800.0 - (800.0 - p.y) / (1.0 + breath * wc);
  float wl = ell(p, vec2(235.0, 640.0), vec2(110.0, 220.0));
  float wr = ell(p, vec2(590.0, 640.0), vec2(75.0, 220.0));
  float tip = clamp((p.y - 400.0) / 400.0, 0.0, 1.0);
  p.x -= hairX * (wl + wr) * tip * tip * sin(t * 1.4 + p.y * 0.012);
  gl_FragColor = texture2D(tex, clamp(p / 800.0, 0.0, 1.0));
}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export class WrenWarp {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private tex: WebGLTexture;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private composite = document.createElement("canvas");
  private images: { base: HTMLImageElement; mouth: HTMLImageElement[]; blink: HTMLImageElement[] } | null = null;
  private frameKey = "";
  private raf = 0;
  private running = false;
  private visible = true;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private observers: { disconnect(): void }[] = [];
  private t0 = performance.now();
  private ready = false;

  // Live inputs from the Avatar component.
  state: AvatarState = "idle";
  mouthFrame: number | null = null; // 0..2 or null (closed)
  blink = 0; // 0 open, 1 half, 2 closed
  mouthOpen = 0;

  // Smoothed values
  private tilt = 0;
  private nod = 0;

  /** Throws if WebGL isn't available, so the caller can keep the static picture. */
  constructor(private canvas: HTMLCanvasElement, private onReady: () => void) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: true });
    if (!gl) throw new Error("no webgl");
    this.gl = gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    this.prog = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["tex", "bodyA", "headA", "headDy", "breath", "hairX", "t"]) this.u[n] = gl.getUniformLocation(prog, n);

    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(this.u.tex, 0);

    this.composite.width = this.composite.height = CROP.size;

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.loop();
    });
    io.observe(canvas);
    const onVis = () => this.loop();
    document.addEventListener("visibilitychange", onVis);
    this.observers.push(ro, io, { disconnect: () => document.removeEventListener("visibilitychange", onVis) });
    this.resize();
  }

  async load() {
    const [base, m1, m2, m3, b1, b2] = await Promise.all(
      ["/avatar/wren-scene.webp", "/avatar/m1.webp", "/avatar/m2.webp", "/avatar/m3.webp", "/avatar/blink1.webp", "/avatar/blink2.webp"].map(
        loadImage,
      ),
    );
    this.images = { base, mouth: [m1, m2, m3], blink: [b1, b2] };
    this.updateTexture(true);
    this.draw(performance.now());
    this.ready = true;
    this.onReady();
    this.loop();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.observers.forEach((o) => o.disconnect());
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
      if (this.ready) this.draw(performance.now());
    }
  }

  /** Paint base + current mouth/blink frames into the texture when they change. */
  private updateTexture(force = false) {
    if (!this.images) return;
    const key = `${this.mouthFrame}:${this.blink}`;
    if (!force && key === this.frameKey) return;
    this.frameKey = key;
    const c = this.composite.getContext("2d")!;
    const { base, mouth, blink } = this.images;
    c.drawImage(base, CROP.x, CROP.y, CROP.size, CROP.size, 0, 0, CROP.size, CROP.size);
    if (this.mouthFrame !== null) c.drawImage(mouth[this.mouthFrame], MOUTH.x - CROP.x, MOUTH.y - CROP.y, MOUTH.w, MOUTH.h);
    if (this.blink > 0) c.drawImage(blink[this.blink - 1], EYES.x - CROP.x, EYES.y - CROP.y, EYES.w, EYES.h);
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.composite);
  }

  private draw(now: number) {
    const gl = this.gl;
    const t = (now - this.t0) / 1000;
    const TAU = Math.PI * 2;
    const m = this.reduced ? 0 : 1;
    const talking = this.state === "talking";

    // Attitude per state, eased so changes never snap.
    const tiltTarget = this.state === "listening" ? 0.022 : this.state === "thinking" ? -0.018 : 0;
    this.tilt += (tiltTarget - this.tilt) * 0.04;
    this.nod += ((talking ? this.mouthOpen : 0) - this.nod) * 0.15;
    const pace = this.state === "thinking" ? 0.7 : talking ? 1.25 : 1;

    const bodyA = m * (0.0105 * Math.sin((t * TAU * pace) / 7.3) + 0.003 * Math.sin((t * TAU) / 3.1));
    const headA = m * (0.011 * Math.sin((t * TAU * pace) / 5.7 + 1) + this.tilt + (talking ? 0.006 * Math.sin(t * 5.1) : 0));
    const headDy = m * 4.5 * this.nod;
    const breath = m * 0.01 * (0.5 + 0.5 * Math.sin((t * TAU) / 4.2));
    const hairX = m * (talking ? 5 : 3.8);

    gl.uniform1f(this.u.bodyA, bodyA);
    gl.uniform1f(this.u.headA, headA);
    gl.uniform1f(this.u.headDy, headDy);
    gl.uniform1f(this.u.breath, breath);
    gl.uniform1f(this.u.hairX, hairX);
    gl.uniform1f(this.u.t, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Tuning aid (enabled with ?wrenDebug): draw the pose at time t, with motion scaled by `gain`. */
  debugDraw(t: number, gain = 1) {
    const saved = this.t0;
    this.t0 = performance.now() - t * 1000;
    const gl = this.gl;
    this.draw(performance.now());
    if (gain !== 1) {
      // Re-issue with amplified uniforms to make the warp regions easy to see.
      for (const n of ["bodyA", "headA", "headDy", "breath", "hairX"] as const) {
        const v = gl.getUniform(this.prog, this.u[n]!) as number;
        gl.uniform1f(this.u[n], v * gain);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    this.t0 = saved;
  }

  /** Called by the Avatar whenever its inputs change. */
  refresh() {
    if (!this.ready) return;
    this.updateTexture();
    if (this.reduced || !this.shouldRun()) this.draw(performance.now());
  }

  private shouldRun() {
    return this.ready && this.visible && document.visibilityState === "visible";
  }

  private loop() {
    if (this.reduced) return; // still picture; refresh() redraws on mouth/blink changes
    if (!this.shouldRun()) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      return;
    }
    if (this.running) return;
    this.running = true;
    const tick = (now: number) => {
      if (!this.running) return;
      this.updateTexture();
      this.draw(now);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
}
