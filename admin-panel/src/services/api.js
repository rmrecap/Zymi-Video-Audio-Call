import axios from 'axios';

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('zymi_admin_token');
  const base = sessionStorage.getItem('zymi_api_base') || '';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.baseURL = base;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 403) {
      sessionStorage.removeItem('zymi_admin_token');
      sessionStorage.removeItem('zymi_admin_user');
      console.warn('[SECURITY] Session terminated — 403 Forbidden from backend');
      window.location.href = '/Zymi-Video-Audio-Call/login';
    }
    const contentType = err.response?.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      const htmlError = new Error(
        'Backend returned HTML (status ' + (err.response?.status || '???') + ') instead of JSON. ' +
        'The server URL may be pointing to the admin portal instead of the Render backend, or the server is asleep.'
      );
      htmlError.isHtmlResponse = true;
      return Promise.reject(htmlError);
    }
    return Promise.reject(err);
  }
);

export default api;
