import axiosClient from './axiosClient';

export const booksApi = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get('/books', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosClient.get(`/books/${id}`);
    return response.data;
  },
  create: async (bookData) => {
    const response = await axiosClient.post('/books', bookData);
    return response.data;
  },
  update: async (id, bookData) => {
    const response = await axiosClient.put(`/books/${id}`, bookData);
    return response.data;
  },
  delete: async (id) => {
    const response = await axiosClient.delete(`/books/${id}`);
    return response.data;
  },
};
