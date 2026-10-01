<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Accounts
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Bambang Sudarsono, S.Kom.',
                'email' => 'admin@perpustakaan.ac.id',
                'password' => '123',
                'role' => 'pengurus',
                'nim' => null,
            ]
        );

        // 2. Seed Default Books
        $books = [
            [
                'id' => 'BK-001',
                'title' => 'Algoritma & Struktur Data Lanjut',
                'author' => 'Rinaldi Munir',
                'category' => 'Ilmu Komputer',
                'year' => 2022,
                'status' => 'Tersedia',
            ],
            [
                'id' => 'BK-002',
                'title' => 'Pemrograman Web Modern Berbasis Komponen',
                'author' => 'Budi Raharjo',
                'category' => 'Teknologi',
                'year' => 2023,
                'status' => 'Tersedia',
            ],
            [
                'id' => 'BK-003',
                'title' => 'Basis Data & Perancangan Sistem Relasional',
                'author' => 'Fathansyah',
                'category' => 'Basis Data',
                'year' => 2021,
                'status' => 'Tersedia',
            ],
            [
                'id' => 'BK-004',
                'title' => 'Rekayasa Perangkat Lunak: Pendekatan Praktisi',
                'author' => 'Roger S. Pressman',
                'category' => 'Rekayasa',
                'year' => 2020,
                'status' => 'Tersedia',
            ],
            [
                'id' => 'BK-005',
                'title' => 'Pengantar Kecerdasan Buatan dan Robotika',
                'author' => 'Suyanto',
                'category' => 'Kecerdasan Buatan',
                'year' => 2024,
                'status' => 'Tersedia',
            ],
        ];

        foreach ($books as $bookData) {
            Book::firstOrCreate(
                ['id' => $bookData['id']],
                array_diff_key($bookData, ['id' => true]),
            );
        }
    }
}
