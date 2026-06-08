document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initRevealOnScroll();
  initSmoothScroll();
  fetchProdutos();
  initContatoForm();
  initFooterYear();
});

/* ── Nav ── */
function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const pill = nav.querySelector('nav');
  window.addEventListener('scroll', () => {
    pill.style.borderColor = window.scrollY > 60
      ? 'rgba(255,255,255,0.16)'
      : 'rgba(255,255,255,0.1)';
  }, { passive: true });
}

/* ── Reveal on scroll ── */
function initRevealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal, .reveal-text').forEach(el => observer.observe(el));
}

/* ── Smooth scroll para âncoras ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Flashlight card ── */
function initFlashlightCards() {
  document.querySelectorAll('.card-flashlight').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top)  + 'px');
    });
  });
}

/* ── Fetch e render do catálogo por categoria ── */
async function fetchProdutos() {
  const body    = document.getElementById('catalogo-body');
  const loading = document.getElementById('produtos-loading');
  if (!body) return;

  try {
    const res  = await fetch('/api/produtos');
    const json = await res.json();

    loading?.remove();

    if (!json.success || json.data.length === 0) {
      body.innerHTML = `<div class="py-20 text-center">
        <p class="font-mono text-[0.6rem] tracking-[0.2em] uppercase opacity-30">Em breve</p>
      </div>`;
      return;
    }

    json.data.forEach((categoria, ci) => {
      const section = document.createElement('div');
      section.className = 'reveal mb-16';
      section.style.transitionDelay = `${ci * 0.1}s`;

      section.innerHTML = `
        <div class="flex items-end justify-between mb-6">
          <div>
            <span class="font-mono text-[0.6rem] tracking-[0.22em] uppercase opacity-40 block mb-2">
              ${String(ci + 1).padStart(2, '0')} — categoria
            </span>
            <h3 class="font-display font-bold tracking-tight leading-none" style="font-size:clamp(1.5rem,3.5vw,2.5rem);">
              ${escapeHtml(categoria.nome.toUpperCase())}
            </h3>
          </div>
          <span class="font-mono text-[0.58rem] tracking-[0.15em] uppercase opacity-25 hidden sm:block">
            ${categoria.produtos.length} produto${categoria.produtos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="relative" data-carousel>
          <div class="carousel-track" id="track-${ci}">
            ${categoria.produtos.map(p => buildCard(p)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-prev" data-dir="prev" aria-label="Anterior">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <button class="carousel-btn carousel-btn-next" data-dir="next" aria-label="Próximo">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>
        </div>`;

      body.appendChild(section);
    });

    initFlashlightCards();
    initCarousels();
    initRevealOnScroll();

  } catch (err) {
    loading?.remove();
    body.innerHTML = `<div class="py-20 text-center">
      <p class="font-mono text-[0.6rem] tracking-[0.2em] uppercase opacity-30">Não foi possível carregar</p>
    </div>`;
  }
}

function buildCard(produto) {
  const preco = produto.price !== null && produto.price !== undefined
    ? `<span class="font-mono text-[0.75rem] tracking-[0.1em]" style="color:rgba(28,15,8,0.75);">
         R$ ${produto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
       </span>`
    : '';

  const imgHtml = produto.imageUrl
    ? `<img src="${escapeHtml(produto.imageUrl)}" alt="${escapeHtml(produto.name)}" width="320" height="240" loading="lazy" />`
    : `<div class="w-full h-full flex items-center justify-center">
         <svg class="w-10 h-10 opacity-10" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909"/>
         </svg>
       </div>`;

  return `
    <div class="carousel-card card-flashlight">
      <div class="card-img">${imgHtml}</div>
      <div class="card-body">
        <h4 class="font-display font-bold text-[#1C0F08] text-[1.05rem] tracking-tight leading-snug mb-2">
          ${escapeHtml(produto.name)}
        </h4>
        ${produto.description
          ? `<p class="font-body font-light text-xs leading-relaxed mb-3"
               style="color:rgba(28,15,8,0.5);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
               ${escapeHtml(produto.description)}
             </p>`
          : ''}
        ${preco}
      </div>
    </div>`;
}

/* ── Carrosséis ── */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const prev  = carousel.querySelector('.carousel-btn-prev');
    const next  = carousel.querySelector('.carousel-btn-next');
    if (!track) return;

    const scrollAmount = () => {
      const card = track.querySelector('.carousel-card');
      return card ? card.offsetWidth + 20 : 320;
    };

    prev?.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }));

    const sync = () => {
      const atStart = track.scrollLeft <= 4;
      const atEnd   = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      prev?.classList.toggle('disabled', atStart);
      next?.classList.toggle('disabled', atEnd);
    };

    track.addEventListener('scroll', sync, { passive: true });
    // Run once after layout
    requestAnimationFrame(sync);
  });
}

/* ── Formulário de contato ── */
function initContatoForm() {
  const form = document.getElementById('contato-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const btn = document.getElementById('form-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const body = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      phone:   form.phone.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res  = await fetch('/api/contato', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        form.reset();
        showFeedback('success');
      } else if (json.errors) {
        showFieldErrors(json.errors);
        btn.disabled = false;
        btn.textContent = 'Enviar mensagem →';
      } else {
        showFeedback('error');
        btn.disabled = false;
        btn.textContent = 'Enviar mensagem →';
      }
    } catch {
      showFeedback('error');
      btn.disabled = false;
      btn.textContent = 'Enviar mensagem →';
    }
  });
}

function clearFormErrors() {
  document.querySelectorAll('.input-error-msg').forEach(el => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  document.querySelectorAll('.input-floating').forEach(el => {
    el.parentElement.classList.remove('input-error');
  });
  document.getElementById('form-feedback').classList.add('hidden');
  document.getElementById('form-success').classList.add('hidden');
  document.getElementById('form-error').classList.add('hidden');
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, msgs]) => {
    const errEl   = document.getElementById(`error-${field}`);
    const fieldEl = document.getElementById(`field-${field}`);
    if (errEl && msgs[0]) {
      errEl.textContent = msgs[0];
      errEl.classList.remove('hidden');
    }
    if (fieldEl) fieldEl.classList.add('input-error');
  });
}

function showFeedback(type) {
  const feedback = document.getElementById('form-feedback');
  const success  = document.getElementById('form-success');
  const error    = document.getElementById('form-error');
  feedback.classList.remove('hidden');
  if (type === 'success') success.classList.remove('hidden');
  else                    error.classList.remove('hidden');
}

/* ── Ano no footer ── */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
