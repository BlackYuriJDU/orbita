/* Camada sensorial: sons e comemoração.
   Tudo é sintetizado aqui, na hora — sem arquivo de áudio e sem rede.
   Quem decide SE algo toca é o app.js (painel "Meus sentidos" e Modo calmo);
   este arquivo só sabe COMO tocar. */
const Efeitos = (() => {
  let ctx = null;

  /* O navegador só libera áudio depois de um toque do aluno; por isso o
     contexto nasce na primeira vez que um som é pedido. */
  function audio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Uma nota: frequência (Hz), quando começa (s), quanto dura (s).
     Volume baixo, entrada e saída suaves: nada de estalo, nada de susto. */
  function nota(a, freq, ini, dur, tipo) {
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + ini;
    o.type = tipo || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /* [frequência, início, duração, tipo]. Acerto sobe (dó-mi-sol); o
     acolhimento desce devagar e macio — nunca um "errou" seco. */
  const SONS = {
    acerto: [[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.3]],
    acolhe: [[392, 0, 0.22, 'triangle'], [330, 0.14, 0.3, 'triangle']],
  };

  function som(tipo) {
    try {
      const a = audio();
      if (a) for (const n of SONS[tipo]) nota(a, n[0], n[1], n[2], n[3]);
    } catch (e) { /* sem áudio: a tela já mostrou o resultado */ }
  }

  /* Confete curto e o bonequinho dá um pulo. Quem pediu menos movimento no
     sistema (prefers-reduced-motion) não recebe nada disso. */
  /* Confete curto em formas geométricas da identidade ÓRBITA.
     O efeito nunca é obrigatório e respeita as duas preferências de redução. */
  function festa() {
    if (document.body && document.body.classList.contains('modo-calmo')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cores = ['#FF7A1A', '#E9FF3D', '#0E7C86', '#7B2FF7', '#E4137A', '#F2E8D5'];
    const formas = ['forma-bloco', 'forma-circulo', 'forma-losango', 'forma-roseta'];
    const caixa = document.createElement('div');
    caixa.className = 'confete';
    caixa.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 18; i++) {
      const p = document.createElement('i');
      p.className = formas[i % formas.length];
      p.style.left = 8 + Math.random() * 84 + '%';
      p.style.background = cores[i % cores.length];
      p.style.animationDelay = Math.random() * 0.18 + 's';
      caixa.appendChild(p);
    }

    document.body.appendChild(caixa);
    setTimeout(() => caixa.remove(), 1550);

    const boneco = document.querySelector('.boneco');
    if (boneco) {
      boneco.classList.add('pulo');
      setTimeout(() => boneco.classList.remove('pulo'), 450);
    }
  }

  return { som, festa };
})();
