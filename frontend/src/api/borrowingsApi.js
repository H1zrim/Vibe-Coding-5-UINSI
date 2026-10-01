import axiosClient from './axiosClient';

export const borrowingsApi = {
  borrow: async (bookId) => {
    const response = await axiosClient.post('/borrowings/borrow', { book_id: bookId });
    return response.data;
  },
  returnBook: async (borrowingId) => {
    const response = await axiosClient.put(`/borrowings/${borrowingId}/return`);
    return response.data;
  },
  getMyBorrowings: async () => {
    const response = await axiosClient.get('/borrowings/my');
    return response.data;
  },
  getAllBorrowings: async (params = {}) => {
    const response = await axiosClient.get('/borrowings/all', { params });
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await axiosClient.get('/dashboard/stats');
    return response.data;
  },
};
