import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

export const adminAPI = {
  getUsers: () => API.get('/admin/users'),
  getAllUsers: () => API.get('/admin/users/all'),
  getUser: (id) => API.get(`/admin/users/${id}`),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getStats: () => API.get('/admin/stats'),
  getManagers: () => API.get('/admin/managers'),
  getEmployees: () => API.get('/admin/employees'),
};

export const projectAPI = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  getStats: (id) => API.get(`/projects/${id}/stats`),
  getTeam: (id) => API.get(`/projects/${id}/team`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, data) => API.post(`/projects/${id}/team`, data),
  removeMember: (id, userId) => API.delete(`/projects/${id}/team/${userId}`),
};

export const milestoneAPI = {
  getByProject: (projectId) => API.get(`/milestones/project/${projectId}`),
  getById: (id) => API.get(`/milestones/${id}`),
  create: (data) => API.post('/milestones', data),
  update: (id, data) => API.put(`/milestones/${id}`, data),
  delete: (id) => API.delete(`/milestones/${id}`),
};

export const taskAPI = {
  getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
  getByMilestone: (milestoneId) => API.get(`/tasks/milestone/${milestoneId}`),
  getMyTasks: () => API.get('/tasks/my'),
  getMyStats: () => API.get('/tasks/my/stats'),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  addUpdate: (id, data) => API.post(`/tasks/${id}/updates`, data),
  getUpdates: (id) => API.get(`/tasks/${id}/updates`),
};

export const reminderAPI = {
  getAll: () => API.get('/reminders'),
  getUnreadCount: () => API.get('/reminders/unread'),
  markRead: (id) => API.patch(`/reminders/${id}/read`),
  markAllRead: () => API.patch('/reminders/read-all'),
  delete: (id) => API.delete(`/reminders/${id}`),
  scan: () => API.post('/reminders/scan'),
};

export const aiAPI = {
  analyze: (formData) => API.post('/ai-insight/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default API;
