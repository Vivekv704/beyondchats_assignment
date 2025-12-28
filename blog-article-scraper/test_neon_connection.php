<?php

// Test direct connection to Neon database
$host = "ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech";
$port = "5432";
$dbname = "neondb";
$username = "neondb_owner";
$password = "npg_n7BqMdy9YObp";

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require;options=endpoint=ep-cold-art-a49vryhh";

try {
    echo "Testing direct connection to Neon database...\n";
    echo "DSN: {$dsn}\n";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✓ Connection successful!\n";
    
    // Test if articles table exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles");
    $count = $stmt->fetchColumn();
    echo "✓ Articles table found with {$count} records\n";
    
    // Test inserting an article
    $stmt = $pdo->prepare("
        INSERT INTO articles (title, author, content, category, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        'Test Article from PHP',
        'Test Author',
        'This is a test article to verify the database connection is working properly.',
        'Test Category'
    ]);
    
    echo "✓ Test article inserted successfully!\n";
    
    // Check the count again
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles");
    $count = $stmt->fetchColumn();
    echo "✓ Articles table now has {$count} records\n";
    
    // Get the last inserted article
    $stmt = $pdo->query("SELECT * FROM articles ORDER BY id DESC LIMIT 1");
    $article = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Last article: " . $article['title'] . " by " . $article['author'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
}