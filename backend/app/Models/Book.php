<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'title',
        'author',
        'category',
        'year',
        'status',
    ];

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'Tersedia';
    }

    public function isBorrowed(): bool
    {
        return $this->status === 'Dipinjam';
    }
}
