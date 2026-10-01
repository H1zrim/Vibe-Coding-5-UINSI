<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Borrowing extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'book_id',
        'user_id',
        'borrow_date',
        'due_date',
        'return_date',
        'status',
    ];

    protected $appends = ['is_overdue'];

    protected function casts(): array
    {
        return [
            'borrow_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'return_date' => 'date:Y-m-d',
        ];
    }

    /**
     * RULE-06: Overdue status derived dynamically without cron/fines.
     */
    protected function isOverdue(): Attribute
    {
        return Attribute::make(
            get: function (): bool {
                if ($this->return_date !== null) {
                    return false;
                }

                $dueDate = $this->due_date ? $this->due_date->format('Y-m-d') : null;

                return $dueDate ? $dueDate < today()->toDateString() : false;
            }
        );
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
