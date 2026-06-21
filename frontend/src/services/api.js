import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[API Error]', error);
    const message = error.response?.data?.error?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const scriptApi = {
  parse: (content, format = 'auto') =>
    api.post('/script/parse', { content, format }),

  toPanels: (parsedScript, layoutPreference = 'balanced') =>
    api.post('/script/to-panels', { parsedScript, layoutPreference })
};

export const generateApi = {
  generatePanel: (data) =>
    api.post('/generate/panel', data),

  generateBatch: (panels, style = 'manga') =>
    api.post('/generate/batch', { panels, style })
};

export const libraryApi = {
  getTemplates: (params = {}) =>
    api.get('/library/templates', { params }),

  getTemplateById: (id) =>
    api.get(`/library/template/${id}`),

  getCategories: () =>
    api.get('/library/categories'),

  getScenes: () =>
    api.get('/library/scenes')
};

export const healthApi = {
  check: () => axios.get('/api/health')
};

export default api;
