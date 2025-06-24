import axios from 'axios';

const API_BASE_URL = 'http://34.28.45.117:9000'; // Updated to the correct IP and port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

const multipartApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const processStartupSh = (dir_name) => {
  const params = new URLSearchParams();
  params.append('dir_name', dir_name);
  return api.post('/execute_codebase', params);
};

export const startCodeserver = (dir_name) => {
  const params = new URLSearchParams();
  params.append('dir_name', dir_name);
  return api.post('/code_server', params);
};

export const rollbackServer = (commit_id, dir_name) => {
  const params = new URLSearchParams();
  params.append('commit_id', commit_id);
  params.append('dir_name', dir_name);
  return api.post('/rollback_server', params);
};

export const getContainerLogs = (dir_name) => {
  return api.get(`/logs/${dir_name}`);
};

export const listDockerContainers = () => {
  return api.get('/containers');
};

export const stopProcess = (dir_name, ides = false) => {
  const params = new URLSearchParams();
  params.append('dir_name', dir_name);
  params.append('ides', ides);
  return api.post('/stop_process', params);
};

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return multipartApi.post('/upload_image', formData);
};
