import { useState, useEffect, useCallback } from 'react';
import { borrowingsApi } from '../api/borrowingsApi';
import toast from 'react-hot-toast';

export const useBorrowings = (mode = 'student') => {
  const [borrowings, setBorrowings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterOverdue, setFilterOverdue] = useState('ALL');

  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'student') {
        const res = await borrowingsApi.getMyBorrowings();
        if (res.success && Array.isArray(res.data)) {
          setBorrowings(res.data);
        }
      } else {
        const params = {};
        if (filterStatus !== 'ALL') params.status = filterStatus;
        if (filterOverdue !== 'ALL') params.overdue = filterOverdue === 'true';
        const [loansRes, statsRes] = await Promise.all([
          borrowingsApi.getAllBorrowings(params),
          borrowingsApi.getDashboardStats().catch(() => null),
        ]);
        if (loansRes.success && Array.isArray(loansRes.data)) {
          setBorrowings(loansRes.data);
        }
        if (statsRes?.success && statsRes.data) {
          setStats(statsRes.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data peminjaman');
    } finally {
      setLoading(false);
    }
  }, [mode, filterStatus, filterOverdue]);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  // Derived state for students
  const activeBorrowings = borrowings.filter((b) => b.status === 'Dipinjam');
  const activeCount = activeBorrowings.length;
  const isQuotaFull = activeCount >= 3;

  const borrowBook = async (bookId) => {
    try {
      const res = await borrowingsApi.borrow(bookId);
      toast.success(res.message || 'Peminjaman berhasil!');
      await fetchBorrowings();
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Peminjaman gagal.';
      toast.error(errorMsg, { duration: 5000 });
      return false;
    }
  };

  const returnBook = async (borrowingId) => {
    try {
      const res = await borrowingsApi.returnBook(borrowingId);
      toast.success(res.message || 'Buku berhasil dikembalikan!');
      await fetchBorrowings();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pengembalian gagal.');
      return false;
    }
  };

  return {
    borrowings,
    activeCount,
    isQuotaFull,
    stats,
    loading,
    filterStatus,
    setFilterStatus,
    filterOverdue,
    setFilterOverdue,
    refetch: fetchBorrowings,
    borrowBook,
    returnBook,
  };
};
