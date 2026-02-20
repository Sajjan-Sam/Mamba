const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// Mobile nav
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(navLinks.classList.contains('open')));
  });
}

// Counter animation
$$('[data-count]').forEach((el) => {
  const target = Number(el.dataset.count || 0);
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const duration = 1000;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * p);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    });
  }, { threshold: 0.35 });
  io.observe(el);
});

// Progress tracker
$$('[data-progress-key]').forEach((block) => {
  const key = block.dataset.progressKey;
  const boxes = $$('input[type="checkbox"]', block);
  const meter = block.querySelector('[data-progress-meter]');
  const stored = JSON.parse(localStorage.getItem(key) || '{}');

  const update = () => {
    let done = 0;
    boxes.forEach((box) => {
      stored[box.value] = box.checked;
      if (box.checked) done += 1;
    });
    localStorage.setItem(key, JSON.stringify(stored));
    if (meter) meter.textContent = `${done}/${boxes.length} complete`;
  };

  boxes.forEach((box) => {
    box.checked = Boolean(stored[box.value]);
    box.addEventListener('change', update);
  });
  update();
});

// Quiz component
$$('.quiz').forEach((quiz) => {
  const button = quiz.querySelector('[data-quiz-check]');
  const output = quiz.querySelector('.quiz-output');
  const answer = quiz.dataset.answer;
  if (!button || !answer || !output) return;
  button.addEventListener('click', () => {
    const chosen = quiz.querySelector('input[type="radio"]:checked');
    if (!chosen) {
      output.textContent = 'Choose one option first.';
      output.style.color = 'var(--warn)';
      return;
    }
    const ok = chosen.value === answer;
    output.textContent = ok ? 'Correct — nice reasoning.' : 'Not quite. Re-read the formalism + example blocks.';
    output.style.color = ok ? 'var(--ok)' : 'var(--warn)';
  });
});

// Fundamentals: discount explorer
const gammaInput = document.querySelector('#gamma');
const gammaOutput = document.querySelector('#gamma-value');
if (gammaInput && gammaOutput) {
  const updateGamma = () => {
    const g = Number(gammaInput.value);
    gammaOutput.textContent = g.toFixed(2);
    const rewards = [2, 1, 4, 3];
    const ret = rewards.reduce((acc, r, i) => acc + r * (g ** i), 0);
    const retEl = document.querySelector('#gamma-return');
    if (retEl) retEl.textContent = ret.toFixed(2);
  };
  gammaInput.addEventListener('input', updateGamma);
  updateGamma();
}

// Bandit demo
const banditStart = document.querySelector('#bandit-run');
if (banditStart) {
  const state = {
    means: [0.22, 0.52, 0.74],
    est: [0, 0, 0],
    count: [0, 0, 0],
    reward: 0,
    steps: 0,
  };
  const pick = (eps) => (Math.random() < eps ? Math.floor(Math.random() * 3) : state.est.indexOf(Math.max(...state.est)));
  const pull = (arm) => (Math.random() < state.means[arm] ? 1 : 0);
  const render = (arm, r) => {
    ['a', 'b', 'c'].forEach((n, i) => {
      document.querySelector(`#est-${n}`).textContent = state.est[i].toFixed(2);
      document.querySelector(`#bar-${n}`).style.width = `${Math.max(3, state.est[i] * 100)}%`;
      document.querySelector(`#cnt-${n}`).textContent = state.count[i];
    });
    document.querySelector('#bandit-total').textContent = state.reward.toFixed(2);
    document.querySelector('#bandit-log').textContent = `Step ${state.steps}: arm ${String.fromCharCode(65 + arm)} → reward ${r}`;
  };
  banditStart.addEventListener('click', () => {
    const eps = Number(document.querySelector('#epsilon').value);
    const rounds = Number(document.querySelector('#rounds').value);
    for (let i = 0; i < rounds; i += 1) {
      const arm = pick(eps);
      const r = pull(arm);
      state.steps += 1;
      state.reward += r;
      state.count[arm] += 1;
      state.est[arm] += (r - state.est[arm]) / state.count[arm];
      if (i === rounds - 1) render(arm, r);
    }
  });
}

// Gridworld demo
const runGrid = document.querySelector('#run-grid');
if (runGrid) {
  const canvas = document.querySelector('#grid');
  const ctx = canvas.getContext('2d');
  const rows = 5, cols = 7, cell = 60;
  const goal = { r: 4, c: 6 }, trap = { r: 2, c: 3 };
  let agent = { r: 0, c: 0 };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        ctx.strokeStyle = '#a8b3cc';
        ctx.strokeRect(c * cell, r * cell, cell, cell);
      }
    }
    ctx.fillStyle = '#76bf85';
    ctx.fillRect(goal.c * cell + 5, goal.r * cell + 5, cell - 10, cell - 10);
    ctx.fillStyle = '#db6c63';
    ctx.fillRect(trap.c * cell + 5, trap.r * cell + 5, cell - 10, cell - 10);
    ctx.fillStyle = '#3059b8';
    ctx.fillRect(agent.c * cell + 12, agent.r * cell + 12, cell - 24, cell - 24);
  };
  const step = () => {
    if (Math.random() < 0.1) {
      agent.r = Math.max(0, agent.r - 1);
      return;
    }
    if (agent.c < goal.c) agent.c += 1;
    else if (agent.r < goal.r) agent.r += 1;
    if (agent.r === trap.r && agent.c === trap.c) agent = { r: 0, c: 0 };
  };
  draw();
  runGrid.addEventListener('click', () => {
    agent = { r: 0, c: 0 };
    const speed = Number(document.querySelector('#grid-speed').value);
    let t = 0;
    draw();
    const id = setInterval(() => {
      step();
      draw();
      t += 1;
      if ((agent.r === goal.r && agent.c === goal.c) || t > 24) clearInterval(id);
    }, speed);
  });
}

// DQN calculator
const qCalc = document.querySelector('#calc-q');
if (qCalc) {
  qCalc.addEventListener('click', () => {
    const alpha = Number(document.querySelector('#q-alpha').value);
    const gamma = Number(document.querySelector('#q-gamma').value);
    const q = Number(document.querySelector('#q-old').value);
    const r = Number(document.querySelector('#q-reward').value);
    const next = Number(document.querySelector('#q-next').value);
    const updated = q + alpha * (r + gamma * next - q);
    document.querySelector('#q-result').textContent = updated.toFixed(3);
  });
}

// Policy gradient temperature explorer
const temp = document.querySelector('#pg-temp');
if (temp) {
  const renderSoftmax = () => {
    const t = Number(temp.value);
    const logits = [2.4, 1.3, 0.8];
    const exps = logits.map((l) => Math.exp(l / t));
    const z = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((v) => (v / z));
    ['left', 'stay', 'right'].forEach((name, i) => {
      document.querySelector(`#pg-${name}`).textContent = `${(probs[i] * 100).toFixed(1)}%`;
    });
    document.querySelector('#pg-temp-out').textContent = t.toFixed(2);
  };
  temp.addEventListener('input', renderSoftmax);
  renderSoftmax();
}

// Applications scorecard
const evalBtn = document.querySelector('#eval-checklist');
if (evalBtn) {
  evalBtn.addEventListener('click', () => {
    const selected = $$('input[name="deploy-check"]:checked').length;
    const out = document.querySelector('#deploy-score');
    out.textContent = `${selected}/5 safeguards selected`;
    out.style.color = selected >= 4 ? 'var(--ok)' : 'var(--warn)';
  });
}
