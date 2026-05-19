<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    /** @var \Illuminate\Console\Command $this */
    $this->comment('Inspire!');
})->purpose('Display an inspiring quote');

app(Schedule::class)->command('borrowings:remind-return')->dailyAt('08:00');