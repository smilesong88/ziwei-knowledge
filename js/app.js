/**
 * Page 1 - 九宫格首页
 */
var App = {
  data: null,
  settings: null,

  init: function() {
    var self = this;
    fetch('data/settings.json')
      .then(function(r) { return r.json(); })
      .catch(function() { return {}; })
      .then(function(s) {
        self.settings = s;
        return fetch('data/content.json');
      })
      .then(function(r) { return r.json(); })
      .catch(function() { return { categories: [] }; })
      .then(function(d) {
        self.data = d;
        self.render();
      });
  },

  render: function() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';

    var cats = this.data && this.data.categories ? this.data.categories : [];

    // Set site title
    if (this.settings && this.settings.siteTitle) {
      var h1 = document.getElementById('hero-title');
      if (h1) h1.textContent = this.settings.siteTitle;
    }

    // Empty state
    if (cats.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📝</div><h3>暂无内容</h3><p>请在管理后台添加内容</p></div>';
      return;
    }

    // Render contact
    var fc = document.getElementById('footer-contact');
    if (fc && this.settings && this.settings.contact) {
      var ct = this.settings.contact;
      var items = [];
      if (ct.email) items.push('<span class="contact-bar-item"><span class="contact-bar-icon">✉️</span><span class="contact-bar-text">' + App.e(ct.email) + '</span></span>');
      if (ct.wechat) items.push('<span class="contact-bar-item"><span class="contact-bar-icon">💬</span><span class="contact-bar-text">微信：' + App.e(ct.wechat) + '</span></span>');
      if (ct.xiaohongshu) items.push('<span class="contact-bar-item"><span class="contact-bar-icon">📕</span><span class="contact-bar-text">小红书：' + App.e(ct.xiaohongshu) + '</span></span>');
      if (ct.phone) items.push('<span class="contact-bar-item"><span class="contact-bar-icon">📞</span><span class="contact-bar-text">' + App.e(ct.phone) + '</span></span>');
      if (items.length) fc.innerHTML = '<div class="contact-bar">' + items.join('') + '</div>';
    }

    // Icon map
    var icons = { 'cat-001': '👑', 'cat-002': '⚡', 'cat-003': '🌙' };
    var fallback = ['🪷','🗡️','🔥','🌊','☀️','💎','🌀','🎋','🔮','🌈'];

    // Build
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      var icon = icons[cat.id] || fallback[i % fallback.length];

      var a = document.createElement('a');
      a.className = 'cat-card';
      a.href = 'category.html?id=' + encodeURIComponent(cat.id);

      var d1 = document.createElement('div');
      d1.className = 'cat-card-icon';
      d1.textContent = icon;
      a.appendChild(d1);

      var d2 = document.createElement('div');
      d2.className = 'cat-card-name';
      d2.textContent = cat.title;
      a.appendChild(d2);

      var d3 = document.createElement('div');
      d3.className = 'cat-card-loc';
      d3.textContent = cat.items ? cat.items.length + ' 个条目' : '';
      a.appendChild(d3);

      var d4 = document.createElement('div');
      d4.className = 'cat-card-desc';
      d4.textContent = cat.description || '';
      a.appendChild(d4);

      grid.appendChild(a);
    }
  },

  e: function(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', function() { App.init(); });
