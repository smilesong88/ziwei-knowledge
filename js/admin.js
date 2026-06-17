/**
 * 管理后台
 * 三层内容管理：分类 → 条目 → 内容
 */
const Admin = {
  settings: null,
  content: null,
  currentSection: 'overview',
  editingCategory: null,
  editingItem: null,
  formattingItem: null,

  async init() {
    await this.loadSettings();
    await this.loadContent();
    // 从 localStorage 恢复 token（不存储在仓库中）
    if (this.settings.github) {
      this.settings.github.token = localStorage.getItem('ziwei_gh_token') || '';
    }
    GitHubAPI.init(this.settings);
    this.renderOverview();
    this.setupNav();
    this.setupFontControls();
  },

  async loadSettings() {
    try {
      const resp = await fetch('data/settings.json');
      this.settings = await resp.json();
    } catch (e) {
      this.settings = this.getDefaultSettings();
    }
  },

  async loadContent() {
    try {
      const resp = await fetch('data/content.json');
      this.content = await resp.json();
    } catch (e) {
      this.content = { categories: [] };
    }
  },

  setupNav() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchSection(link.dataset.section);
      });
    });
  },

  switchSection(section) {
    this.currentSection = section;
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-section="${section}"]`)?.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');

    switch (section) {
      case 'overview': this.renderOverview(); break;
      case 'content': this.renderContentList(); break;
      case 'contact': this.renderContactSettings(); break;
      case 'fonts': this.renderFontSettings(); break;
      case 'ai': this.renderAISettings(); break;
      case 'github': this.renderGitHubSettings(); break;
    }
  },

  // ========== 概览 ==========
  renderOverview() {
    const el = document.getElementById('overview-stats');
    if (!el) return;
    const totalItems = (this.content?.categories || []).reduce((sum, c) => sum + (c.items?.length || 0), 0);
    el.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-number">${this.content?.categories?.length || 0}</div><div class="stat-label">分类数</div></div>
        <div class="stat-card"><div class="stat-number">${totalItems}</div><div class="stat-label">条目数</div></div>
        <div class="stat-card"><div class="stat-number">${this.settings?.contact ? '✓' : '○'}</div><div class="stat-label">联系方式</div></div>
      </div>`;
  },

  // ========== 知识文章管理（三层） ==========
  renderContentList() {
    const el = document.getElementById('content-list');
    if (!el) return;
    const cats = this.content?.categories || [];

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:var(--font-body);font-weight:600;">分类列表 (${cats.length})</h3>
        <button class="btn btn-primary" onclick="Admin.showAddCategory()">+ 新建分类</button>
      </div>
      ${cats.length === 0 ? '<div class="empty-state"><div class="icon">📝</div><h3>暂无分类</h3></div>' :
        cats.map(cat => `
          <div class="content-card" style="margin-bottom:24px;">
            <div class="content-card-header">
              <div class="content-card-title" style="font-size:16px;">${this.escapeHtml(cat.title)}</div>
              <div class="content-card-actions">
                <button class="btn btn-sm btn-secondary" onclick="Admin.editCategory('${cat.id}')">编辑分类</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.deleteCategory('${cat.id}')">删除分类</button>
              </div>
            </div>
            <div class="content-card-desc">${this.escapeHtml(cat.description)}</div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">📋 条目列表 (${cat.items?.length || 0})</span>
                <button class="btn btn-sm btn-primary" onclick="Admin.showAddItem('${cat.id}')">+ 添加条目</button>
              </div>
              ${(cat.items || []).length === 0 ? '<p style="font-size:13px;color:var(--text-tertiary);padding:12px 0;">暂无条目，点击上方按钮添加</p>' :
                (cat.items || []).map(item => `
                  <div class="item-manage-card" style="flex-direction:column;align-items:stretch;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <div class="item-manage-info">
                        <div class="item-manage-title">${this.escapeHtml(item.title)}</div>
                        <div class="item-manage-desc">${this.escapeHtml(item.description || '无描述')}</div>
                        <div class="item-manage-meta">${item.stems ? Object.keys(item.stems).filter(s => item.stems[s]?.content).length + '/10 天干已填写' : ((item.content || '').length > 0 ? '有内容' : '空')}</div>
                      </div>
                      <div class="item-manage-actions">
                        <button class="btn btn-sm btn-secondary" onclick="Admin.toggleContent('${cat.id}','${item.id}')">📖 内容</button>
                        <button class="btn btn-sm btn-secondary" onclick="Admin.editItem('${cat.id}','${item.id}')">✏️ 编辑</button>
                        <button class="btn btn-sm btn-ai" onclick="Admin.aiFormatItem('${cat.id}','${item.id}')">✨ 排版</button>
                        <button class="btn btn-sm btn-danger" onclick="Admin.deleteItem('${cat.id}','${item.id}')">🗑️</button>
                      </div>
                    </div>
                    ${item.stems ? `<div style="display:flex;gap:4px;margin-top:8px;">${['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].map(s => `<span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;${item.stems[s]?.content ? 'background:var(--primary);color:#fff;' : 'background:var(--border);color:var(--text-tertiary);'}">${s}</span>`).join('')}</div>` : ''}
                    <div id="content-preview-${item.id}" class="content-preview" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light);">
                      <div class="preview-label" style="font-size:12px;color:var(--text-tertiary);margin-bottom:8px;">内容预览：</div>
                      <div class="preview-body markdown-body" style="max-height:300px;overflow-y:auto;padding:12px;background:var(--bg);border-radius:8px;font-size:14px;line-height:1.8;">${item.content ? (typeof marked !== 'undefined' ? marked.parse(item.content) : item.content.replace(/\n/g, '<br>')) : '<span style="color:#bbb">暂无内容</span>'}</div>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
        `).join('')}
    `;
  },

  showAddCategory() {
    this.editingCategory = null;
    document.getElementById('modal-title').textContent = '新建分类';
    document.getElementById('cat-title').value = '';
    document.getElementById('cat-desc').value = '';
    document.getElementById('modal-overlay').classList.add('active');
  },

  editCategory(id) {
    const cat = (this.content.categories || []).find(c => c.id === id);
    if (!cat) return;
    this.editingCategory = id;
    document.getElementById('modal-title').textContent = '编辑分类';
    document.getElementById('cat-title').value = cat.title || '';
    document.getElementById('cat-desc').value = cat.description || '';
    document.getElementById('modal-overlay').classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    this.editingCategory = null;
    this.editingItem = null;
  },

  async saveCategory() {
    const title = document.getElementById('cat-title').value.trim();
    const desc = document.getElementById('cat-desc').value.trim();
    if (!title) { showToast('请输入标题', 'error'); return; }

    const now = new Date().toISOString();
    if (this.editingCategory) {
      const cat = this.content.categories.find(c => c.id === this.editingCategory);
      if (cat) { cat.title = title; cat.description = desc; cat.updatedAt = now; }
    } else {
      this.content.categories.push({ id: 'cat-' + Date.now(), title, description: desc, items: [], createdAt: now, updatedAt: now });
    }
    await this.saveContent();
    this.closeModal();
    this.renderContentList();
    showToast('保存成功', 'success');
  },

  async deleteCategory(id) {
    if (!confirm('确定要删除此分类及其所有条目吗？')) return;
    this.content.categories = this.content.categories.filter(c => c.id !== id);
    await this.saveContent();
    this.renderContentList();
    showToast('已删除', 'success');
  },

  // ========== 条目管理 ==========
  toggleContent(catId, itemId) {
    const el = document.getElementById(`content-preview-${itemId}`);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  showAddItem(catId) {
    this.editingItem = { catId, itemId: null, currentStem: '甲' };
    document.getElementById('item-modal-title').textContent = '新建条目';
    document.getElementById('item-title').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-content').value = '';
    this.renderEditStemTabs('甲', null);
    document.getElementById('item-modal-overlay').classList.add('active');
  },

  editItem(catId, itemId) {
    const cat = (this.content.categories || []).find(c => c.id === catId);
    const item = cat?.items?.find(i => i.id === itemId);
    if (!item) return;
    this.editingItem = { catId, itemId, currentStem: '甲' };
    document.getElementById('item-modal-title').textContent = '编辑条目';
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-desc').value = item.description || '';
    
    // 加载天干内容
    const firstStem = '甲';
    const stemContent = item.stems?.[firstStem]?.content || item.content || '';
    document.getElementById('item-content').value = stemContent;
    
    this.renderEditStemTabs(firstStem, item);
    document.getElementById('item-modal-overlay').classList.add('active');
  },

  renderEditStemTabs(activeStem, item) {
    const container = document.getElementById('stem-tabs-edit');
    if (!container) return;
    const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    container.innerHTML = STEMS.map(s => {
      const hasContent = item?.stems?.[s]?.content ? true : false;
      return `<button class="stem-tab-sm ${s === activeStem ? 'active' : ''}" onclick="Admin.switchEditStem('${s}')" title="${hasContent ? '已填写' : '未填写'}">
        ${s}
        ${hasContent ? '<span style="font-size:9px;color:#059669;margin-left:2px;">●</span>' : ''}
      </button>`;
    }).join('');
  },

  switchEditStem(stem) {
    if (!this.editingItem) return;
    this.editingItem.currentStem = stem;
    
    const cat = this.editingItem.catId ? (this.content.categories || []).find(c => c.id === this.editingItem.catId) : null;
    const item = this.editingItem.itemId ? cat?.items?.find(i => i.id === this.editingItem.itemId) : null;
    
    // 先保存当前文本域内容到内存
    const currentContent = document.getElementById('item-content').value;
    
    // 更新标签状态
    document.querySelectorAll('#stem-tabs-edit .stem-tab-sm').forEach(t => {
      t.classList.toggle('active', t.textContent.trim().startsWith(stem));
    });
    
    // 切换到新天干的内容
    const newContent = item?.stems?.[stem]?.content || '';
    document.getElementById('item-content').value = newContent;
  },

  closeItemModal() {
    document.getElementById('item-modal-overlay').classList.remove('active');
    this.editingItem = null;
  },

  async saveItem() {
    if (!this.editingItem) return;
    const title = document.getElementById('item-title').value.trim();
    const desc = document.getElementById('item-desc').value.trim();
    const content = document.getElementById('item-content').value;
    if (!title) { showToast('请输入标题', 'error'); return; }

    const cat = this.content.categories.find(c => c.id === this.editingItem.catId);
    if (!cat) return;
    if (!cat.items) cat.items = [];

    const now = new Date().toISOString();
    const currentStem = this.editingItem.currentStem || '甲';

    if (this.editingItem.itemId) {
      const item = cat.items.find(i => i.id === this.editingItem.itemId);
      if (item) {
        item.title = title;
        item.description = desc;
        // 保存当前天干内容
        if (!item.stems) item.stems = {};
        item.stems[currentStem] = {
          title: currentStem + '年生人命盘解读',
          content: content
        };
        item.updatedAt = now;
      }
    } else {
      // 新条目，初始化 stems
      const stems = {};
      const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      STEMS.forEach(s => {
        const stemContent = s === currentStem ? content : '';
        stems[s] = {
          title: s + '年生人命盘解读',
          content: stemContent
        };
      });
      cat.items.push({
        id: 'item-' + Date.now(),
        title,
        description: desc,
        stems,
        createdAt: now,
        updatedAt: now
      });
    }
    cat.updatedAt = now;
    await this.saveContent();
    this.closeItemModal();
    this.renderContentList();
    showToast('保存成功', 'success');
  },

  async deleteItem(catId, itemId) {
    if (!confirm('确定要删除此条目吗？')) return;
    const cat = this.content.categories.find(c => c.id === catId);
    if (cat?.items) {
      cat.items = cat.items.filter(i => i.id !== itemId);
      cat.updatedAt = new Date().toISOString();
    }
    await this.saveContent();
    this.renderContentList();
    showToast('已删除', 'success');
  },

  // ========== AI 排版 ==========
  async aiFormatItem(catId, itemId) {
    const cat = (this.content.categories || []).find(c => c.id === catId);
    const item = cat?.items?.find(i => i.id === itemId);
    if (!item) return;

    if (!item.content?.trim()) {
      showToast('该条目没有内容可排版', 'error');
      return;
    }

    if (!this.settings?.ai?.apiUrl || !this.settings?.ai?.apiKey) {
      showToast('请先在 AI 排版设置中配置接口信息', 'error');
      return;
    }

    this.formattingItem = { catId, itemId };
    showToast('正在 AI 排版中...', 'info');

    try {
      const response = await fetch(this.settings.ai.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.ai.apiKey}`
        },
        body: JSON.stringify({
          model: this.settings.ai.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: this.settings.ai.systemPrompt || '你是一个专业的内容编辑，请对用户提供的 Markdown 内容进行排版优化，保持内容不变，只优化格式和结构。' },
            { role: 'user', content: `请对以下紫微斗数相关内容进行排版优化：\n\n${item.content}` }
          ],
          temperature: 0.3,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `AI 接口错误: ${response.status}`);
      }

      const result = await response.json();
      const formatted = result.choices?.[0]?.message?.content;

      if (formatted) {
        item.content = formatted;
        item.updatedAt = new Date().toISOString();
        cat.updatedAt = new Date().toISOString();
        await this.saveContent();
        this.renderContentList();
        showToast('排版完成', 'success');
      } else {
        showToast('AI 返回内容为空', 'error');
      }
    } catch (e) {
      console.error('AI 排版失败:', e);
      showToast('排版失败: ' + e.message, 'error');
    } finally {
      this.formattingItem = null;
    }
  },

  // ========== 联系方式管理 ==========
  renderContactSettings() {
    const c = this.settings?.contact || {};
    document.getElementById('contact-email').value = c.email || '';
    document.getElementById('contact-wechat').value = c.wechat || '';
    document.getElementById('contact-xiaohongshu').value = c.xiaohongshu || '';
    document.getElementById('contact-phone').value = c.phone || '';
  },

  async saveContactSettings() {
    if (!this.settings.contact) this.settings.contact = {};
    this.settings.contact.email = document.getElementById('contact-email').value.trim();
    this.settings.contact.wechat = document.getElementById('contact-wechat').value.trim();
    this.settings.contact.xiaohongshu = document.getElementById('contact-xiaohongshu').value.trim();
    this.settings.contact.phone = document.getElementById('contact-phone').value.trim();
    await this.saveSettings();
    showToast('联系方式已保存', 'success');
  },

  // ========== 字体设置 ==========
  setupFontControls() {
    document.querySelectorAll('.font-range').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target.dataset.target;
        document.getElementById(`font-val-${target}`).textContent = e.target.value + 'px';
        document.documentElement.style.setProperty(`--font-${target}`, e.target.value + 'px');
      });
    });
  },

  renderFontSettings() {
    const fonts = this.settings?.fonts || {};
    const targets = ['heading', 'subheading', 'body', 'caption', 'cardTitle'];
    const labels = ['大标题', '小标题', '正文', '注释', '卡片标题'];
    const el = document.getElementById('font-controls');
    if (!el) return;
    el.innerHTML = targets.map((t, i) => {
      const size = fonts[t]?.size || [28, 20, 16, 14, 18][i];
      return `<div class="font-setting-card"><h4>${labels[i]}</h4><div class="font-size-control"><input type="range" class="font-range" data-target="${t}" min="10" max="48" value="${size}"><span class="font-size-value" id="font-val-${t}">${size}px</span></div></div>`;
    }).join('');
  },

  async saveFontSettings() {
    const targets = ['heading', 'subheading', 'body', 'caption', 'cardTitle'];
    if (!this.settings.fonts) this.settings.fonts = {};
    targets.forEach(t => {
      const input = document.querySelector(`.font-range[data-target="${t}"]`);
      if (input) { if (!this.settings.fonts[t]) this.settings.fonts[t] = {}; this.settings.fonts[t].size = parseInt(input.value); }
    });
    await this.saveSettings();
    showToast('字体设置已保存', 'success');
  },

  // ========== AI 设置 ==========
  renderAISettings() {
    const ai = this.settings?.ai || {};
    document.getElementById('ai-api-url').value = ai.apiUrl || '';
    document.getElementById('ai-api-key').value = ai.apiKey || '';
    document.getElementById('ai-model').value = ai.model || 'deepseek-chat';
    document.getElementById('ai-prompt').value = ai.systemPrompt || '';
  },

  async saveAISettings() {
    if (!this.settings.ai) this.settings.ai = {};
    this.settings.ai.apiUrl = document.getElementById('ai-api-url').value.trim();
    this.settings.ai.apiKey = document.getElementById('ai-api-key').value.trim();
    this.settings.ai.model = document.getElementById('ai-model').value.trim();
    this.settings.ai.systemPrompt = document.getElementById('ai-prompt').value;
    await this.saveSettings();
    showToast('AI 设置已保存', 'success');
  },

  // ========== GitHub 设置 ==========
  renderGitHubSettings() {
    const gh = this.settings?.github || {};
    document.getElementById('gh-owner').value = gh.owner || '';
    document.getElementById('gh-repo').value = gh.repo || '';
    document.getElementById('gh-branch').value = gh.branch || 'main';
    document.getElementById('gh-token').value = localStorage.getItem('ziwei_gh_token') || '';
  },

  async saveGitHubSettings() {
    if (!this.settings.github) this.settings.github = {};
    this.settings.github.owner = document.getElementById('gh-owner').value.trim();
    this.settings.github.repo = document.getElementById('gh-repo').value.trim();
    this.settings.github.branch = document.getElementById('gh-branch').value.trim() || 'main';
    // token 存 localStorage，不提交到仓库（安全考虑）
    const token = document.getElementById('gh-token').value.trim();
    if (token) {
      localStorage.setItem('ziwei_gh_token', token);
    } else {
      localStorage.removeItem('ziwei_gh_token');
    }
    this.settings.github.token = token;
    GitHubAPI.init(this.settings);
    // 保存 settings 时不包含 token
    const ghBackup = { ...this.settings.github };
    delete this.settings.github.token;
    await this.saveSettings();
    this.settings.github.token = ghBackup.token;
    showToast('GitHub 设置已保存', 'success');
  },

  // ========== 通用 ==========
  async saveContent() {
    try {
      if (GitHubAPI.isConfigured()) {
        // 通过 GitHub API 保存到仓库
        const existing = await GitHubAPI.getFile('data/content.json');
        await GitHubAPI.saveFile('data/content.json', this.content, existing?.sha, 'Update content.json via admin');
      } else {
        // 本地开发时 fallback 到 PUT
        await fetch('data/content.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.content, null, 2) });
      }
    } catch (e) { showToast('保存失败: ' + e.message, 'error'); }
  },

  async saveSettings() {
    try {
      if (GitHubAPI.isConfigured()) {
        // 通过 GitHub API 保存到仓库
        const existing = await GitHubAPI.getFile('data/settings.json');
        await GitHubAPI.saveFile('data/settings.json', this.settings, existing?.sha, 'Update settings.json via admin');
      } else {
        // 本地开发时 fallback 到 PUT
        await fetch('data/settings.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.settings, null, 2) });
      }
    } catch (e) { showToast('保存失败: ' + e.message, 'error'); }
  },

  escapeHtml(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; },
  formatDate(s) { if (!s) return ''; const d = new Date(s); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },
  getDefaultSettings() { return { siteTitle: '紫微斗数知识分享', fonts: { heading:{size:28}, subheading:{size:20}, body:{size:16}, caption:{size:14}, cardTitle:{size:18} }, ai: {}, github: {} }; }
};

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => Admin.init());
