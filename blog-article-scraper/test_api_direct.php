<?php

// Test the API endpoints directly without Laravel
$host = "ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech";
$port = "5432";
$dbname = "neondb";
$username = "neondb_owner";
$password = "npg_n7BqMdy9YObp";

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require;options=endpoint=ep-cold-art-a49vryhh";

try {
    echo "Testing API endpoints directly...\n";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✓ Database connection successful!\n";
    
    // Simulate GET /api/articles
    $stmt = $pdo->query("
        SELECT id, title, author, content, category, created_at, updated_at, 
               'original' as type, null as enhancement_date, null as references
        FROM articles 
        ORDER BY created_at DESC 
        LIMIT 12
    ");
    
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✓ Found " . count($articles) . " articles\n";
    
    // Format the response like Laravel would
    $response = [
        'data' => $articles,
        'meta' => [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 12,
            'total' => count($articles)
        ]
    ];
    
    // Output JSON response
    header('Content-Type: application/json');
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}