<?php

namespace CodeIU\LaravelSfb;

use CodeIU\LaravelSfb\SfbCompiler;
use Illuminate\Support\ServiceProvider;

class SfbServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(
            __DIR__.'/config/codeiu-laravel-sfb.php', 'codeiu-laravel-sfb'
        );
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/config/codeiu-laravel-sfb.php' => config_path('codeiu-laravel-sfb.php'),
            ], 'codeiu-laravel-sfb-config');
        }

        if (method_exists($this->app['blade.compiler'], 'precompiler')) {
            $this->app['blade.compiler']->precompiler(function ($string) {
                return app(SfbCompiler::class)->compile($string);
            });
        }
    }
}
