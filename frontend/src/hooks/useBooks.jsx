import { useState, useEffect, useCallback } from 'react';
import { booksApi } from '../api/booksApi';
import toast from 'react-hot-toast';

export const useBooks = (initialParams = {}) => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState(initialParams);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await booksApi.getAll(params);
      if (res.success && Array.isArray(res.data)) {
        setBooks(res.data);
        if (!params.search && (!params.category || params.category === 'ALL')) {
          setCategories([...new Set(res.data.map((book) => book.category))]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat katalog buku');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const createBook = async (bookData) => {
    try {
      const res = await booksApi.create(bookData);
      toast.success(res.message || 'Buku berhasil ditambahkan');
      fetchBooks();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambah buku');
      return false;
    }
  };

  const updateBook = async (id, bookData) => {
    try {
      const res = await booksApi.update(id, bookData);
      toast.success(res.message || 'Buku berhasil diperbarui');
      fetchBooks();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui buku');
      return false;
    }
  };

  const deleteBook = async (id) => {
    try {
      const res = await booksApi.delete(id);
      toast.success(res.message || 'Buku berhasil dihapus');
      fetchBooks();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus buku');
      return false;
    }
  };

  return {
    books,
    categories,
    loading,
    params,
    setParams,
    refetch: fetchBooks,
    createBook,
    updateBook,
    deleteBook,
  };
};
