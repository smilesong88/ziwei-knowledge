/**
 * Page 2 - 分类详情页
 */
const Category = {
  data: null,
  settings: null,
  category: null,

  async init() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) { this.showError('未指定分类'); return; }

    await this.loadSettings();
    await this.loadContent(id);
    this.render();
  },

  async loadSettings() {
    try {
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (isLocal) {
        const resp = await fetch('data/settings.json');
        this.settings = await resp.json();
      } else {
        this.settings = await this.loadFromGitHub('data/settings.json');
      }
      this.applyFontSettings();
    } catch (e) {
      this.settings = { fonts: {} };
    }
  },

  async loadContent(id) {
    try {
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (isLocal) {
        const resp = await fetch('data/content.json');
        this.data = await resp.json();
      } else {
        this.data = await this.loadFromGitHub('data/content.json');
      }
      this.category = (this.data.categories || []).find(c => c.id === id);
    } catch (e) {
      console.error('加载内容失败:', e);
    }
  },

  async loadFromGitHub(filePath) {
    GitHubAPI.init(this.settings);
    if (GitHubAPI.isConfigured()) {
      const file = await GitHubAPI.getFile(filePath);
      return file ? file.content : null;
    }
    const url = `https://raw.githubusercontent.com/${this.settings.github.owner}/${this.settings.github.repo}/${this.settings.github.branch}/${filePath}`;
    const resp = await fetch(url);
    return resp.json();
  },

  applyFontSettings() {
    if (!this.settings?.fonts) return;
    const root = document.documentElement;
    const f = this.settings.fonts;
    if (f.heading) root.style.setProperty('--font-heading', f.heading.size + 'px');
    if (f.body) root.style.setProperty('--font-size', f.body.size + 'px');
    if (f.caption) root.style.setProperty('--font-caption', f.caption.size + 'px');
  },

  render() {
    if (!this.category) { this.showError('分类不存在'); return; }

    document.title = this.category.title + ' - 紫微斗数知识分享';

    // 返回链接
    const backEl = document.getElementById('back-link');
    if (backEl) {
      backEl.textContent = this.category.title;
      backEl.href = `index.html`;
    }

    // 标题
    const titleEl = document.getElementById('category-title');
    const descEl = document.getElementById('category-desc');
    if (titleEl) titleEl.textContent = this.category.title;
    if (descEl) descEl.textContent = this.category.description || '';

    // 条目列表
    const gridEl = document.getElementById('items-grid');
    if (!gridEl) return;

    const items = this.category.items || [];
    if (items.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">📝</div>
          <h3>暂无条目</h3>
          <p>请在管理后台添加条目</p>
        </div>`;
      return;
    }

    gridEl.innerHTML = items.map(item => `
      <a class="palace-item" href="detail.html?cat=${encodeURIComponent(this.category.id)}&item=${encodeURIComponent(item.id)}">
        <div class="palace-item-name">${this.escapeHtml(item.title)}</div>
        <div class="palace-item-desc">${this.escapeHtml(item.description || '')}</div>
        <div class="palace-item-arrow">查看十天干解读 →</div>
      </a>
    `).join('');
  },

  showError(msg) {
    const gridEl = document.getElementById('items-grid');
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">⚠️</div>
          <h3>${msg}</h3>
          <p><a href="index.html">返回首页</a></p>
        </div>`;
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => Category.init());
