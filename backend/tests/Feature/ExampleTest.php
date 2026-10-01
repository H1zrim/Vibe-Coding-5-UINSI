<?php

namespace Tests\Feature;

it('returns the health status in the standard API envelope', function () {
    $response = $this->getJson('/api/health');

    expect($response->status())->toBe(200)
        ->and($response->json('success'))->toBeTrue()
        ->and($response->json('data.database'))->toBe('sqlite')
        ->and($response->json('errors'))->toBeNull();
});
