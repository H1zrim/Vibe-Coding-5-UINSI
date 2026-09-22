-- SQLite schema referensi.
-- Aplikasi menjalankan migrasi ini secara otomatis melalui app/core/SqliteDatabase.php.

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	username TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	name TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'mahasiswa',
	nim TEXT NULL
);

CREATE TABLE IF NOT EXISTS books (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	category TEXT NOT NULL,
	year INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'Tersedia'
);

CREATE TABLE IF NOT EXISTS borrowings (
	id TEXT PRIMARY KEY,
	bookId TEXT NOT NULL,
	userId TEXT NOT NULL,
	borrowDate TEXT NOT NULL,
	dueDate TEXT NOT NULL,
	returnDate TEXT NULL,
	status TEXT NOT NULL DEFAULT 'Dipinjam',
	FOREIGN KEY (bookId) REFERENCES books (id),
	FOREIGN KEY (userId) REFERENCES users (id)
);