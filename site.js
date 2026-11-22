'use strict';

const hero = document.querySelector('.hero');
const slides = [...hero.querySelectorAll('.slide')];
const slideNames = ['על הגריל', 'בתוך הבאגט', 'על הקרש'];
let slideIndex = 0;
let slideRequest = 0;

async function showSlide(step) {
  slideIndex = (slideIndex + step + slides.length) % slides.length;
  const index = slideIndex;
  const request = ++slideRequest;
  const image = slides[index].querySelector('img');
  if (image.dataset.src) {
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
  try {
    await image.decode();
  } catch {
    if (request === slideRequest) slideIndex = slides.findIndex(slide => slide.classList.contains('active'));
    return;
  }
  if (request !== slideRequest) return;
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  document.querySelector('#slide-title').textContent = slideNames[index];
  document.querySelector('#slide-index').textContent = String(index + 1).padStart(2, '0');
  hero.dispatchEvent(new Event('scenechange'));
}
document.querySelector('#prev-slide').addEventListener('click', () => showSlide(-1));
document.querySelector('#next-slide').addEventListener('click', () => showSlide(1));

const ticker = document.querySelector('.ticker-inner');
const phrases = ['נקניקיות בעבודת יד', 'בשר איכותי', 'משלוחים ברחבי הארץ', 'בלי קיצורי דרך'];
for (const phrase of [...phrases, ...phrases]) {
  const star = document.createElement('i');
  star.textContent = '✳';
  const label = document.createElement('span');
  label.textContent = phrase;
  ticker.append(star, label);
}

const menuButton = document.querySelector('#menu-toggle');
const menu = document.querySelector('#mobile-nav');
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
  menuButton.querySelector('use').setAttribute('href', open ? '#close' : '#menu');
}
menuButton.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', () => setMenu(false));
document.addEventListener('click', event => {
  if (!menu.hidden && !event.target.closest('header')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
matchMedia('(min-width:681px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

const dishes = {
  merguez: {
    title: 'מרגז עם צנוברים', en: 'MERGUEZ',
    story: 'אביב לוקח את השקשוקה לכיוון אחר. מרגז חריף עם צנוברים נכנס לבאגט פריך עם בצל, שום ופלפל חריף. מעל באים שומר קראנצ׳י, פטרוזיליה ורוקולה עם לימון.',
    post: 'DehovoYxMCb'
  },
  chicken: {
    title: 'נקניקיות פרגית', en: 'CHICKEN SAUSAGE',
    story: 'מה משתנה כשמשחקים עם המרקם? אביב מציג שתי גרסאות מאותה פרגית, אחת חלקה ואחת בטחינה דקה, ושואל איזו מהן הייתם בוחרים.',
    post: 'DfKkpQRiRzP'
  },
  arayes: {
    title: 'עראייס על האש', en: 'ARAYES',
    story: 'הפעם תערובת הבשר המתובלת של הנקניקיות נכנסת לפיתה. אביב מעביר אותה לגריל עד שהפיתה נחרכת קלות ונעשית פריכה, והבשר שבפנים נשאר עסיסי.',
    post: 'DfcoN_cRVdH'
  }
};
const dialog = document.querySelector('.dish-dialog');
for (const button of document.querySelectorAll('.dish')) {
  button.addEventListener('click', () => {
    const key = button.dataset.dish;
    const dish = dishes[key];
    const image = document.querySelector('#dialog-img');
    image.src = './assets/' + key + '-1200.webp';
    image.alt = button.querySelector('img').alt;
    document.querySelector('#dialog-title').textContent = dish.title;
    document.querySelector('#dialog-en').textContent = dish.en;
    document.querySelector('#dialog-text').textContent = dish.story;
    document.querySelector('#dialog-post').href = 'https://www.instagram.com/p/' + dish.post + '/';
    dialog.showModal();
    document.body.classList.add('modal-open');
  });
}
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let pointerX = 0;
function movePhoto(x, y) {
  hero.style.setProperty('--px', x.toFixed(1) + 'px');
  hero.style.setProperty('--py', y.toFixed(1) + 'px');
}
hero.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPreference.matches) return;
  const box = hero.getBoundingClientRect();
  pointerX = (event.clientX - box.left) / box.width - 0.5;
  movePhoto(pointerX * 12, ((event.clientY - box.top) / box.height - 0.5) * 8);
});
hero.addEventListener('pointerleave', () => { pointerX = 0; movePhoto(0, 0); });

// A small field of warm embers rises over the grill. The photograph also works on its own.
function lightGrill() {
  const canvas = document.querySelector('#embers');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false });
  if (!gl) return;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const vertex = compile(gl.VERTEX_SHADER, `
    attribute vec3 seed;
    uniform float t, ratio, cursor, compact;
    varying float opacity;
    void main() {
      float phase = fract(seed.y + t * (0.045 + seed.z * 0.024));
      float x = seed.x * mix(.52,.88,compact) + .018 * sin(t*.45+seed.y*29.) + phase * (.035 + cursor*.018);
      float y = mix(.94,.49,compact) - phase * mix(.78,.46,compact);
      gl_Position = vec4(x * 2. - 1., 1. - y * 2., 0., 1.);
      gl_PointSize = clamp((1.1 + 2.35*seed.z) * ratio, 1., 5.);
      opacity = sin(phase * 3.14159) * (.21 + .32*seed.z);
    }`);
  const fragment = compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying float opacity;
    void main() {
      float r = length(gl_PointCoord - .5) * 2.;
      gl_FragColor = vec4(1.,.57,.22,opacity * (1.-smoothstep(.12,1.,r)));
    }`);
  const program = gl.createProgram();
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const seeds = new Float32Array(3 * 36);
  for (let i = 0; i < seeds.length; i++) {
    const n = Math.sin((i + 4) * 154.73) * 9281.13;
    seeds[i] = n - Math.floor(n);
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'seed');
  gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const time = gl.getUniformLocation(program, 't');
  const cursor = gl.getUniformLocation(program, 'cursor');
  let visible = false;
  let frame = 0;
  let last = 0;
  function resize() {
    const bounds = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.45);
    canvas.width = Math.round(bounds.width * ratio); canvas.height = Math.round(bounds.height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'ratio'), ratio);
    gl.uniform1f(gl.getUniformLocation(program, 'compact'), bounds.width <= 680 ? 1 : 0);
  }
  function draw(now) {
    if (now - last > 32) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(time, now / 1000); gl.uniform1f(cursor, pointerX);
      gl.drawArrays(gl.POINTS, 0, seeds.length / 3);
      last = now;
    }
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(frame);
    if (visible && !document.hidden && !motionPreference.matches && slides[0].classList.contains('active')) frame = requestAnimationFrame(draw);
    else gl.clear(gl.COLOR_BUFFER_BIT);
  }
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(hero);
  motionPreference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  hero.addEventListener('scenechange', sync);
}
if (!motionPreference.matches) lightGrill();
