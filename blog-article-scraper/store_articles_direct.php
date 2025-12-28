<?php

// Direct database connection without Laravel ORM
$host = 'ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech';
$port = '5432';
$dbname = 'neondb';
$username = 'neondb_owner';
$password = 'npg_n7BqMdy9YObp';

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require;options=endpoint=ep-cold-art-a49vryhh";

// Sample articles data
$articles = [
    [
        'title' => 'Can Chatbots Boost Small Business Growth?',
        'author' => 'Ritika Sankhla',
        'publication_date' => '2023-12-08 00:00:00',
        'content' => 'In today\'s competitive business landscape, small businesses are constantly seeking innovative ways to enhance customer engagement, streamline operations, and drive growth. One technology that has emerged as a game-changer is chatbots. These AI-powered virtual assistants are revolutionizing how small businesses interact with their customers, providing 24/7 support, automating routine tasks, and delivering personalized experiences. But can chatbots truly boost small business growth? Let\'s explore the transformative potential of chatbots and how they can be a catalyst for success in the small business arena.',
        'category' => 'Business Growth'
    ],
    [
        'title' => '10X Your Leads: How Chatbots Revolutionize Lead Generation',
        'author' => 'Ritika Sankhla',
        'publication_date' => '2023-12-08 00:00:00',
        'content' => 'Lead generation is the lifeblood of any business, and in today\'s digital age, companies are constantly seeking innovative ways to attract, engage, and convert potential customers. Enter chatbots – the game-changing technology that\'s revolutionizing how businesses approach lead generation. These AI-powered virtual assistants are not just customer service tools; they\'re sophisticated lead generation machines capable of capturing, qualifying, and nurturing prospects around the clock. In this comprehensive guide, we\'ll explore how chatbots can 10X your leads and transform your business\'s growth trajectory.',
        'category' => 'Lead Generation'
    ],
    [
        'title' => '7 Clear Indicators Your Business Needs a Virtual Assistant',
        'author' => 'Ritika Sankhla',
        'publication_date' => '2023-12-07 00:00:00',
        'content' => 'Running a business is like juggling multiple balls in the air – you\'re managing operations, handling customer inquiries, overseeing marketing campaigns, and trying to grow your company all at once. As your business expands, the workload can become overwhelming, and you might find yourself stretched thin across various tasks. This is where a virtual assistant can be a game-changer. But how do you know when it\'s time to bring one on board? Here are seven clear indicators that your business is ready for a virtual assistant.',
        'category' => 'Virtual Assistant'
    ],
    [
        'title' => '7 ways a Live Chatbot transforms customer interaction',
        'author' => 'Ritika Sankhla',
        'publication_date' => '2023-12-06 00:00:00',
        'content' => 'Customer interaction has evolved dramatically in the digital age. Gone are the days when businesses could rely solely on phone calls and emails to connect with their audience. Today\'s customers expect instant, personalized, and seamless communication experiences. Enter live chatbots – the revolutionary technology that\'s transforming how businesses engage with their customers. These AI-powered assistants are not just automated response systems; they\'re sophisticated tools that can understand, learn, and adapt to provide exceptional customer experiences. Let\'s explore seven powerful ways live chatbots are revolutionizing customer interaction.',
        'category' => 'Customer Service'
    ],
    [
        'title' => 'Chatbots Magic: Beginner\'s Guidebook',
        'author' => 'Ritika Sankhla',
        'publication_date' => '2023-12-05 00:00:00',
        'content' => 'Welcome to the fascinating world of chatbots! If you\'ve ever wondered about those helpful digital assistants that pop up on websites, answer questions instantly, or guide you through online purchases, you\'re about to discover the magic behind them. Chatbots have revolutionized how businesses interact with customers, providing instant support, personalized experiences, and seamless communication around the clock. Whether you\'re a business owner looking to enhance customer service, a developer interested in AI technology, or simply curious about how chatbots work, this beginner\'s guide will unlock the secrets of chatbot magic and show you how these digital wizards can transform your business or understanding of modern technology.',
        'category' => 'Chatbot Basics'
    ]
];

try {
    echo "Connecting to Neon database...\n";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✓ Connected successfully!\n\n";
    
    // Check if articles table exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'articles'");
    $tableExists = $stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        echo "✗ Articles table does not exist. Please run migrations first.\n";
        exit(1);
    }
    
    echo "✓ Articles table found\n";
    
    // Get current count
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles");
    $initialCount = $stmt->fetchColumn();
    echo "Current articles in database: {$initialCount}\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($articles as $index => $article) {
        try {
            echo "Processing article " . ($index + 1) . ": {$article['title']}\n";
            
            // Check for duplicates
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM articles WHERE title = ? AND publication_date = ?");
            $stmt->execute([$article['title'], $article['publication_date']]);
            $exists = $stmt->fetchColumn() > 0;
            
            if ($exists) {
                echo "  ⚠ Article already exists, skipping...\n\n";
                continue;
            }
            
            // Insert article
            $stmt = $pdo->prepare("
                INSERT INTO articles (title, author, publication_date, content, category, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $result = $stmt->execute([
                $article['title'],
                $article['author'],
                $article['publication_date'],
                $article['content'],
                $article['category']
            ]);
            
            if ($result) {
                $articleId = $pdo->lastInsertId();
                echo "  ✓ Successfully stored with ID: {$articleId}\n";
                echo "    Author: {$article['author']}\n";
                echo "    Date: {$article['publication_date']}\n";
                echo "    Category: {$article['category']}\n\n";
                $successCount++;
            } else {
                echo "  ✗ Failed to insert article\n\n";
                $errorCount++;
            }
            
        } catch (Exception $e) {
            echo "  ✗ Error: {$e->getMessage()}\n\n";
            $errorCount++;
        }
    }
    
    // Get final count
    $stmt = $pdo->query("SELECT COUNT(*) FROM articles");
    $finalCount = $stmt->fetchColumn();
    
    echo "=== SUMMARY ===\n";
    echo "Successfully stored: {$successCount} articles\n";
    echo "Failed to store: {$errorCount} articles\n";
    echo "Skipped (duplicates): " . (count($articles) - $successCount - $errorCount) . " articles\n";
    echo "Total processed: " . count($articles) . " articles\n";
    echo "Articles in database: {$initialCount} → {$finalCount}\n";
    
    if ($successCount > 0) {
        echo "\n=== VERIFICATION ===\n";
        echo "Recent articles in database:\n";
        
        $stmt = $pdo->query("
            SELECT id, title, author, publication_date, category 
            FROM articles 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        
        while ($row = $stmt->fetch()) {
            echo "  - ID {$row['id']}: {$row['title']} by {$row['author']} ({$row['category']})\n";
        }
        
        echo "\nArticles by category:\n";
        $stmt = $pdo->query("
            SELECT category, COUNT(*) as count 
            FROM articles 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY count DESC
        ");
        
        while ($row = $stmt->fetch()) {
            echo "  - {$row['category']}: {$row['count']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Error: {$e->getMessage()}\n";
    exit(1);
}