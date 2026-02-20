const counters = document.querySelectorAll('[data-count]');
const animate = (el) => {
  const target = Number(el.dataset.count || 0);
  const start = performance.now();
  const duration = 1200;
  const frame = (t) => {
    const p = Math.min((t - start) / duration, 1);
    el.textContent = Math.floor(target * p);
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};
const io = new IntersectionObserver((entries, obs) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      animate(e.target);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach((c) => io.observe(c));
