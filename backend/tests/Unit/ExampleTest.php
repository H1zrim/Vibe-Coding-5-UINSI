<?php

use Illuminate\Support\Carbon;

it('calculates the loan period as seven calendar days', function () {
    $borrowDate = Carbon::parse('2026-10-01');

    expect($borrowDate->copy()->addDays(7)->toDateString())->toBe('2026-10-08');
});
