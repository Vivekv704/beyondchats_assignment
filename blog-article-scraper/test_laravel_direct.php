<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

try {
    echo "Testing Laravel with custom DSN...\n";
    
    // Set custom database configuration
    Config::set('database.connections.neon', [
        'driver' => 'pgsql',
        'host' => 'ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech',
        'port' => '5432',
        'database' => 'neondb',
        'username' => 'neondb_owner',
        'password' => 'npg_n7BqMdy9YObp',
        'charset' => 'utf8',
        'prefix' => '',
        'prefix_indexes' => true,
        'search_path' => 'public',
        'sslmode' => 'require',
        'options' => [
            \PDO::ATTR_TIMEOUT => 30,
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        ],
    ]);
    
    // Try to connect using the custom connection
    $pdo = new PDO(
        'pgsql:host=ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech;port=5432;dbname=neondb;sslmode=require;options=endpoint=ep-cold-art-a49vryhh',
        'neondb_owner',
        'npg_n7BqMdy9YObp',
        [
            \PDO::ATTR_TIMEOUT => 30,
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        ]
    );
    
    echo "✓ Direct PDO connection successful!\n";
    
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM articles");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Articles count: " . $result['count'] . "\n";
    
    // Now let's try to make Laravel use this connection by overriding the connector
    
} catch (Exception $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
}