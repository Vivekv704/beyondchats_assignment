<?php

use App\Http\Controllers\ArticleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Direct database connection routes (temporary fix)
Route::get('/articles-direct', function (Request $request) {
    try {
        // Direct PDO connection
        $host = "ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech";
        $port = "5432";
        $dbname = "neondb";
        $username = "neondb_owner";
        $password = "npg_n7BqMdy9YObp";

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require;options=endpoint=ep-cold-art-a49vryhh";

        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        // Get pagination parameters
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 12);
        $type = $request->get('type', 'all');
        $offset = ($page - 1) * $perPage;

        // Build query
        $whereClause = '';
        $params = [];

        if ($type !== 'all') {
            $whereClause = "WHERE type = :type";
            $params['type'] = $type;
        }

        // Get total count
        $countQuery = "SELECT COUNT(*) FROM articles {$whereClause}";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();

        // Get articles
        $query = "
            SELECT id, title, author, content, category, created_at, updated_at, 
                   'original' as type, null as enhancement_date, null as references
            FROM articles 
            {$whereClause}
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format response
        $lastPage = ceil($total / $perPage);

        return response()->json([
            'data' => $articles,
            'meta' => [
                'current_page' => (int) $page,
                'last_page' => (int) $lastPage,
                'per_page' => (int) $perPage,
                'total' => (int) $total
            ]
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Direct article detail route
Route::get('/articles-direct/{id}', function ($id) {
    try {
        // Direct PDO connection
        $host = "ep-cold-art-a49vryhh-pooler.us-east-1.aws.neon.tech";
        $port = "5432";
        $dbname = "neondb";
        $username = "neondb_owner";
        $password = "npg_n7BqMdy9YObp";

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require;options=endpoint=ep-cold-art-a49vryhh";

        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        // Get article by ID
        $stmt = $pdo->prepare("
            SELECT id, title, author, content, category, created_at, updated_at, 
                   'original' as type, null as enhancement_date, null as references
            FROM articles 
            WHERE id = :id
        ");
        $stmt->execute(['id' => $id]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$article) {
            return response()->json([
                'error' => 'Article not found'
            ], 404);
        }

        return response()->json([
            'data' => $article
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Article API routes
Route::prefix('articles')->middleware('throttle:60,1')->group(function () {
    // Core CRUD routes
    Route::get('/', [ArticleController::class, 'index']); // GET /api/articles
    Route::post('/', [ArticleController::class, 'store'])->middleware('throttle:10,1'); // POST /api/articles (stricter limit)
    Route::get('/{id}', [ArticleController::class, 'show']); // GET /api/articles/{id}
    Route::put('/{id}', [ArticleController::class, 'update'])->middleware('throttle:20,1'); // PUT /api/articles/{id}
    Route::delete('/{id}', [ArticleController::class, 'destroy'])->middleware('throttle:5,1'); // DELETE /api/articles/{id}
    
    // Additional routes
    Route::get('/search/query', [ArticleController::class, 'search']); // GET /api/articles/search/query?q=term
    Route::get('/category/{category}', [ArticleController::class, 'byCategory']); // GET /api/articles/category/{category}
    Route::get('/author/{author}', [ArticleController::class, 'byAuthor']); // GET /api/articles/author/{author}
    Route::get('/stats/overview', [ArticleController::class, 'statistics']); // GET /api/articles/stats/overview
});

// Alternative RESTful resource route (commented out in favor of explicit routes above)
// Route::apiResource('articles', ArticleController::class);