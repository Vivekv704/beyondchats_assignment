<?php

namespace App\Providers;

use Illuminate\Database\Connectors\PostgresConnector;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\DatabaseManager;
use PDO;

class NeonDatabaseServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Override the PostgreSQL connector to support Neon endpoint parameter
        $this->app->bind('db.connector.pgsql', function () {
            return new class extends PostgresConnector {
                public function connect(array $config)
                {
                    $dsn = $this->getDsn($config);
                    
                    // Add endpoint parameter for Neon
                    if (str_contains($config['host'] ?? '', 'neon.tech')) {
                        $endpoint = explode('-', explode('.', $config['host'])[0])[0] ?? '';
                        if ($endpoint) {
                            $dsn .= ';options=endpoint=' . $endpoint;
                        }
                    }
                    
                    $options = $this->getOptions($config);
                    
                    return $this->createConnection($dsn, $config, $options);
                }
            };
        });
    }

    public function boot()
    {
        //
    }
}