<?php

namespace App\Providers;

use App\Services\ArticleScraperService;
use App\Services\ArticleService;
use Illuminate\Support\ServiceProvider;

class ArticleServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register ArticleScraperService as singleton
        $this->app->singleton(ArticleScraperService::class, function ($app) {
            return new ArticleScraperService();
        });

        // Register ArticleService with dependency injection
        $this->app->singleton(ArticleService::class, function ($app) {
            return new ArticleService($app->make(ArticleScraperService::class));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
