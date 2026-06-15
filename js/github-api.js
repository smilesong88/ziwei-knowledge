/**
 * GitHub API 封装
 * 用于读写仓库中的 JSON 数据文件
 */
const GitHubAPI = {
  config: {
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
  },

  /**
   * 初始化配置
   */
  init(settings) {
    if (settings && settings.github) {
      this.config = { ...this.config, ...settings.github };
    }
  },

  /**
   * 是否已配置
   */
  isConfigured() {
    return this.config.owner && this.config.repo && this.config.token;
  },

  /**
   * API 请求封装
   */
  async request(endpoint, options = {}) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    };

    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * 获取文件内容
   */
  async getFile(filePath) {
    try {
      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`;
      const data = await this.request(endpoint);
      const content = atob(data.content.replace(/\n/g, ''));
      return {
        content: JSON.parse(content),
        sha: data.sha,
        path: filePath
      };
    } catch (e) {
      if (e.message.includes('404')) {
        return null;
      }
      throw e;
    }
  },

  /**
   * 创建或更新文件
   */
  async saveFile(filePath, content, sha = null, message = null) {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
    const body = {
      message: message || `Update ${filePath}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      branch: this.config.branch
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  /**
   * 从 raw URL 获取数据（无需认证）
   */
  async fetchRaw(filePath) {
    const url = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${filePath}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    return response.json();
  }
};
