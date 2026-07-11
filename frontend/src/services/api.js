// Native fetch wrapper replacing axios
const api = async (url, options = {}) => {
  const baseURL = '/api';
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
  
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = localStorage.getItem('access_token');
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(fullUrl, options);

  if (response.status === 401 && url !== '/auth/login/') {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${baseURL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('access_token', data.access);
          options.headers.Authorization = `Bearer ${data.access}`;
          response = await fetch(fullUrl, options);
        } else {
          throw new Error('Refresh failed');
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login?expired=true';
      }
    }
  }

  // To mimic axios API a bit:
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    return Promise.reject({ response: { status: response.status, data } });
  }

  return { data, status: response.status };
};

['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
  if (method === 'get' || method === 'delete') {
    api[method] = (url, config = {}) => {
      let finalUrl = url;
      if (config.params) {
        const query = new URLSearchParams(config.params).toString();
        if (query) {
          finalUrl += (finalUrl.includes('?') ? '&' : '?') + query;
        }
      }
      return api(finalUrl, { ...config, method: method.toUpperCase() });
    };
  } else {
    api[method] = (url, body, config = {}) => {
      let finalUrl = url;
      if (config.params) {
        const query = new URLSearchParams(config.params).toString();
        if (query) {
          finalUrl += (finalUrl.includes('?') ? '&' : '?') + query;
        }
      }
      const options = { ...config, method: method.toUpperCase() };
      if (body) {
        options.body = JSON.stringify(body);
      }
      return api(finalUrl, options);
    };
  }
});

export default api;