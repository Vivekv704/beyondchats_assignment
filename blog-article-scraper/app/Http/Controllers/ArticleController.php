<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Services\ArticleService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ArticleController extends Controller
{
    protected ArticleService $articleService;

    public function __construct(ArticleService $articleService)
    {
        $this->articleService = $articleService;
    }

    /**
     * Display a listing of articles.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100
            
            $articles = $this->articleService->getAllArticles($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $articles->items(),
                'meta' => [
                    'current_page' => $articles->currentPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                    'last_page' => $articles->lastPage(),
                    'from' => $articles->firstItem(),
                    'to' => $articles->lastItem(),
                ]
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to retrieve articles', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve articles'
            ], 500);
        }
    }

    /**
     * Store a newly created article.
     *
     * @param CreateArticleRequest $request
     * @return JsonResponse
     */
    public function store(CreateArticleRequest $request): JsonResponse
    {
        try {
            // Check if HTML is provided for scraping
            if ($request->has('html') && !empty($request->input('html'))) {
                $article = $this->articleService->createFromHtml($request->input('html'));
            } else {
                // Create from direct data
                $article = $this->articleService->createArticle($request->validated());
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Article created successfully',
                'data' => $article
            ], 201);
            
        } catch (Exception $e) {
            Log::error('Failed to create article', [
                'error' => $e->getMessage(),
                'request_data' => $request->validated()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified article.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $article = $this->articleService->findArticle((int) $id);
            
            return response()->json([
                'success' => true,
                'data' => $article
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to retrieve article', [
                'article_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            if (str_contains($e->getMessage(), 'not found')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article not found'
                ], 404);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve article'
            ], 500);
        }
    }

    /**
     * Update the specified article.
     *
     * @param UpdateArticleRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(UpdateArticleRequest $request, string $id): JsonResponse
    {
        try {
            $article = $this->articleService->updateArticle((int) $id, $request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Article updated successfully',
                'data' => $article
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to update article', [
                'article_id' => $id,
                'error' => $e->getMessage(),
                'request_data' => $request->validated()
            ]);
            
            if (str_contains($e->getMessage(), 'not found')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article not found'
                ], 404);
            }
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified article.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->articleService->deleteArticle((int) $id);
            
            return response()->json([
                'success' => true,
                'message' => 'Article deleted successfully'
            ], 204);
            
        } catch (Exception $e) {
            Log::error('Failed to delete article', [
                'article_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            if (str_contains($e->getMessage(), 'not found')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article not found'
                ], 404);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete article'
            ], 500);
        }
    }

    /**
     * Search articles by query.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->get('q', '');
            $perPage = $request->get('per_page', 15);
            $perPage = min(max($perPage, 1), 100);
            
            if (empty($query)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query is required'
                ], 400);
            }
            
            $articles = $this->articleService->searchArticles($query, $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $articles->items(),
                'meta' => [
                    'current_page' => $articles->currentPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                    'last_page' => $articles->lastPage(),
                    'query' => $query
                ]
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to search articles', [
                'query' => $request->get('q'),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to search articles'
            ], 500);
        }
    }

    /**
     * Get articles by category.
     *
     * @param Request $request
     * @param string $category
     * @return JsonResponse
     */
    public function byCategory(Request $request, string $category): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $perPage = min(max($perPage, 1), 100);
            
            $articles = $this->articleService->getArticlesByCategory($category, $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $articles->items(),
                'meta' => [
                    'current_page' => $articles->currentPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                    'last_page' => $articles->lastPage(),
                    'category' => $category
                ]
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to retrieve articles by category', [
                'category' => $category,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve articles'
            ], 500);
        }
    }

    /**
     * Get articles by author.
     *
     * @param Request $request
     * @param string $author
     * @return JsonResponse
     */
    public function byAuthor(Request $request, string $author): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $perPage = min(max($perPage, 1), 100);
            
            $articles = $this->articleService->getArticlesByAuthor($author, $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $articles->items(),
                'meta' => [
                    'current_page' => $articles->currentPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                    'last_page' => $articles->lastPage(),
                    'author' => $author
                ]
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to retrieve articles by author', [
                'author' => $author,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve articles'
            ], 500);
        }
    }

    /**
     * Get article statistics.
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->articleService->getStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Failed to retrieve statistics', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics'
            ], 500);
        }
    }
}
