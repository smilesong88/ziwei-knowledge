/**
 * Page 3 - 宫位详情页
 * 天干分页导航 + Markdown 渲染
 */
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let data = null, settings = null, catId = null, itemId = null, curStemIdx = 0;

function getParam(n) { return new URLSearchParams(window.location.search).get(n); }

async function load() {
  catId = getParam('cat');
  itemId = getParam('item');
  if (!catId || !itemId) { showError('参数不完整'); return; }

  try {
    const settingsResp = await fetch('data/settings.json');
    settings = await settingsResp.json();
  } catch (e) { settings = {}; }

  try {
    const resp = await fetch('data/content.json');
    data = await resp.json();
  } catch (e) {
    showError('加载数据失败');
    return;
  }

  render();
}

function render() {
  if (!data || !data.categories) return;

  const cat = data.categories.find(c => c.id === catId);
  const item = cat ? (cat.items || []).find(i => i.id === itemId) : null;

  if (!item) { showError('内容不存在'); return; }

  document.title = item.title + ' - 紫微斗数知识分享';

  // 返回链接
  const bc = document.getElementById('back-cat');
  if (bc && cat) {
    bc.textContent = cat.title;
    bc.href = 'category.html?id=' + encodeURIComponent(cat.id);
  }

  // 标题
  document.getElementById('palace-title').textContent = item.title;
  document.getElementById('palace-desc').textContent = item.description || '';

  // 天干分页导航
  const hasStems = item.stems && Object.keys(item.stems).length > 0;
  const stemsNav = document.getElementById('stems-nav');

  if (hasStems) {
    stemsNav.style.display = 'flex';
    stemsNav.innerHTML = STEMS.map((s, i) =>
      `<button class="stem-tab${i === curStemIdx ? ' active' : ''}" onclick="switchStem(${i})">${s}</button>`
    ).join('');
  } else {
    stemsNav.style.display = 'none';
  }

  renderStem(item, hasStems);
}

function switchStem(idx) {
  curStemIdx = idx;
  document.querySelectorAll('.stem-tab').forEach((t, i) => t.classList.toggle('active', i === idx));

  const cat = data.categories.find(c => c.id === catId);
  const item = cat ? (cat.items || []).find(i => i.id === itemId) : null;
  if (item) renderStem(item, true);

  // 滚动到内容区
  document.getElementById('stem-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderStem(item, hasStems) {
  const el = document.getElementById('stem-content');
  const pagEl = document.getElementById('stem-pagination');

  if (hasStems && item.stems[STEMS[curStemIdx]]) {
    const stem = STEMS[curStemIdx];
    const sd = item.stems[stem];
    const title = sd.title || stem + '年生人命盘解读';
    const content = sd.content || '';

    el.innerHTML = `<div class="stem-card">
      <div class="stem-card-title">${escapeHtml(title)}</div>
      <div class="stem-card-body">${markdownToHtml(content)}</div>
    </div>`;

    // 分页导航
    if (pagEl) {
      pagEl.style.display = 'flex';
      pagEl.innerHTML = `
        <button class="page-btn" onclick="switchStem(${curStemIdx - 1})" ${curStemIdx === 0 ? 'disabled' : ''}>← 上一页</button>
        <div class="page-info">
          ${STEMS.map((s, i) => `<span class="page-dot ${i === curStemIdx ? 'active' : ''}" onclick="switchStem(${i})">${s}</span>`).join('')}
        </div>
        <button class="page-btn" onclick="switchStem(${curStemIdx + 1})" ${curStemIdx === 9 ? 'disabled' : ''}>下一页 →</button>
      `;
    }
  } else if (item.content) {
    el.innerHTML = `<div class="stem-card">
      <div class="stem-card-body">${markdownToHtml(item.content)}</div>
    </div>`;
    if (pagEl) pagEl.style.display = 'none';
  } else {
    el.innerHTML = `<div class="stem-card">
      <div class="stem-card-body"><p style="color:#bbb;font-style:italic">暂无内容</p></div>
    </div>`;
    if (pagEl) pagEl.style.display = 'none';
  }
}

function markdownToHtml(md) {
  if (!md) return '';
  try {
    if (typeof marked !== 'undefined') {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(md);
    }
  } catch (e) {}
  return md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showError(msg) {
  const el = document.getElementById('stem-content');
  if (el) {
    el.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${msg}</h3><p><a href="index.html">返回首页</a></p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', load);
