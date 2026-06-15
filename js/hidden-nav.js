/**
 * 隐藏导航 — 点击6次图标才跳转
 */
const HiddenNav = {
  counters: { admin: 0 },
  required: 6,

  init() {
    try {
      const saved = sessionStorage.getItem('hidden-nav-counters');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.counters = { admin: parsed.admin || 0 };
      }
    } catch (e) {}
  },

  click(target) {
    this.counters[target]++;
    this.save();

    const remaining = this.required - this.counters[target];
    const el = document.getElementById(`hidden-${target}`);

    if (remaining > 0) {
      if (el) {
        el.title = `再点击 ${remaining} 次`;
        el.style.opacity = 0.3 + (this.counters[target] / this.required) * 0.7;
        el.style.transform = `scale(${0.8 + (this.counters[target] / this.required) * 0.4})`;
      }
    } else {
      this.counters[target] = 0;
      this.save();
      window.location.href = 'admin.html';
    }
  },

  save() {
    try {
      sessionStorage.setItem('hidden-nav-counters', JSON.stringify(this.counters));
    } catch (e) {}
  }
};

HiddenNav.init();
