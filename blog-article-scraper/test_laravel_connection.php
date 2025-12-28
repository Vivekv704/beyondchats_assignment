<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Article;

try {
    echo "Testing Laravel connection to Neon database...\n";
    
    // Test raw database connection
    $result = DB::select('SELECT COUNT(*) as count FROM articles');
    echo "✓ Laravel DB connection successful!\n";
    echo "✓ Articles table has " . $result[0]->count . " records\n";
    
    // Test using Eloquent model
    $count = Article::count();
    echo "✓ Eloquent model working! Article count: {$count}\n";
    
    // Test creating an article using Eloquent
    $article = new Article([
        'title' => 'Test Article from Laravel',
        'author' => 'Laravel Test',
        'content' => 'This is a test article created using Laravel Eloquent to verify the connection works.',
        'category' => 'Laravel Test'
    ]);
    
    $article->save();
    echo "✓ Article created successfully with ID: " . $article->id . "\n";
    
    // Test retrieving articles
    $articles = Article::all();
    echo "✓ Retrieved " . $articles->count() . " articles from database\n";
    
    foreach ($articles as $article) {
        echo "  - {$article->title} by {$article->author}\n";
    }
    
} catch (Exception $e) {
    echo "✗ Laravel connection failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}