#!/bin/bash
# Menjalankan ketiga microservice sekaligus (user, book, borrowing).
# Jalankan dari root folder proyek: ./start-all.sh
# Hentikan semua dengan Ctrl+C.

set -e
cd "$(dirname "$0")"

echo "Menjalankan user-service di port 4001..."
(cd services/user-service && node server.js) &
PID_USER=$!

echo "Menjalankan book-service di port 4002..."
(cd services/book-service && node server.js) &
PID_BOOK=$!

echo "Menjalankan borrowing-service di port 4003..."
(cd services/borrowing-service && node server.js) &
PID_BORROW=$!

echo ""
echo "Semua service berjalan. Buka frontend/index.html di browser"
echo "(atau jalankan: npx serve frontend)"
echo ""

trap "kill $PID_USER $PID_BOOK $PID_BORROW" EXIT
wait
