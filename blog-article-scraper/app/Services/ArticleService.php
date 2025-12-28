<?php

namespace App\Services;

use App\Models\Article;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ArticleService
{
    protected ArticleScraperService $scraperService;

    public function __construct(ArticleScraperService $scraperService)
    {
        $this->scraperService = $scraperService;
    }

    /**
     * Create article from HTML content.
     *
     * @param string $html
     * @return Article
     * @throws Exception
     */
    public function createFromHtml(string $html): Article
    {
        try {
            // Scrape article data from HTML
            $articleData = $this->scraperService->scrapeArticle($html);
            
            // Create article from scraped data
            return $this->createArticle($articleData);
            
        } catch (Exception $e) {
            Log::error('Failed to create article from HTML', [
                'error' => $e->getMessage(),
                'html_length' => strlen($html)
            ]);
            
            throw new Exception('Failed to create article from HTML: ' . $e->getMessage());
        }
    }

    /**
     * Create article from validated data.
     *
     * @param array $data
     * @return Article
     * @throws Exception
     */
    public function createArticle(array $data): Article
    {
        try {
            // Check for duplicates
            if ($this->isDuplicate($data['title'], $data['publication_date'] ?? null)) {
                throw new Exception('Article with this title and publication date already exists');
            }
            
            // Sanitize input data
            $sanitizedData = $this->sanitizeArticleData($data);
            
            // Create and save article
            $article = new Article($sanitizedData);
            $article->save();
            
            Log::info('Article created successfully', [
                'article_id' => $article->id,
                'title' => $article->title
            ]);
            
            return $article;
            
        } catch (Exception $e) {
            Log::error('Failed to create article', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            throw $e;
        }
    }

    /**
     * Update existing article.
     *
     * @param int $id
     * @param array $data
     * @return Article
     * @throws Exception
     */
    public function updateArticle(int $id, array $data): Article
    {
        try {
            $article = $this->findArticle($id);
            
            // Check for duplicates (excluding current article)
            if (isset($data['title']) && isset($data['publication_date'])) {
                if ($this->isDuplicate($data['title'], $data['publication_date'], $id)) {
                    throw new Exception('Another article with this title and publication date already exists');
                }
            }
            
            // Sanitize input data
            $sanitizedData = $this->sanitizeArticleData($data);
            
            // Update article
            $article->fill($sanitizedData);
            $article->save();
            
            Log::info('Article updated successfully', [
                'article_id' => $article->id,
                'title' => $article->title
            ]);
            
            return $article;
            
        } catch (Exception $e) {
            Log::error('Failed to update article', [
                'article_id' => $id,
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            throw $e;
        }
    }

    /**
     * Delete article by ID.
     *
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function deleteArticle(int $id): bool
    {
        try {
            $article = $this->findArticle($id);
            
            $deleted = $article->delete();
            
            Log::info('Article deleted successfully', [
                'article_id' => $id,
                'title' => $article->title
            ]);
            
            return $deleted;
            
        } catch (Exception $e) {
            Log::error('Failed to delete article', [
                'article_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Find article by ID.
     *
     * @param int $id
     * @return Article
     * @throws Exception
     */
    public function findArticle(int $id): Article
    {
        $article = Article::find($id);
        
        if (!$article) {
            throw new Exception("Article with ID {$id} not found");
        }
        
        return $article;
    }

    /**
     * Get all articles with pagination.
     *
     * @param int $perPage
     * @param int $page
     * @return LengthAwarePaginator
     */
    public function getAllArticles(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return Article::orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Get articles by category.
     *
     * @param string $category
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getArticlesByCategory(string $category, int $perPage = 15): LengthAwarePaginator
    {
        return Article::where('category', $category)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get articles by author.
     *
     * @param string $author
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getArticlesByAuthor(string $author, int $perPage = 15): LengthAwarePaginator
    {
        return Article::where('author', $author)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Search articles by title or content.
     *
     * @param string $query
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function searchArticles(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return Article::where('title', 'LIKE', "%{$query}%")
            ->orWhere('content', 'LIKE', "%{$query}%")
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Check if article is duplicate based on title and publication date.
     *
     * @param string $title
     * @param string|null $publicationDate
     * @param int|null $excludeId
     * @return bool
     */
    protected function isDuplicate(string $title, ?string $publicationDate, ?int $excludeId = null): bool
    {
        $query = Article::where('title', $title);
        
        if ($publicationDate) {
            $query->where('publication_date', $publicationDate);
        } else {
            $query->whereNull('publication_date');
        }
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    /**
     * Sanitize article data to prevent XSS and other security issues.
     *
     * @param array $data
     * @return array
     */
    protected function sanitizeArticleData(array $data): array
    {
        $sanitized = [];
        
        // Sanitize title
        if (isset($data['title'])) {
            $sanitized['title'] = strip_tags(trim($data['title']));
        }
        
        // Sanitize author
        if (isset($data['author'])) {
            $sanitized['author'] = strip_tags(trim($data['author']));
        }
        
        // Sanitize publication_date
        if (isset($data['publication_date'])) {
            $sanitized['publication_date'] = $data['publication_date'];
        }
        
        // Sanitize content (allow basic HTML tags)
        if (isset($data['content'])) {
            $allowedTags = '<p><br><strong><em><ul><ol><li><h1><h2><h3><h4><h5><h6><blockquote>';
            $sanitized['content'] = strip_tags(trim($data['content']), $allowedTags);
        }
        
        // Sanitize category
        if (isset($data['category'])) {
            $sanitized['category'] = strip_tags(trim($data['category']));
        }
        
        return $sanitized;
    }

    /**
     * Get article statistics.
     *
     * @return array
     */
    public function getStatistics(): array
    {
        return [
            'total_articles' => Article::count(),
            'articles_by_category' => Article::select('category', DB::raw('count(*) as count'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->get()
                ->pluck('count', 'category')
                ->toArray(),
            'articles_by_author' => Article::select('author', DB::raw('count(*) as count'))
                ->groupBy('author')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->pluck('count', 'author')
                ->toArray(),
            'recent_articles' => Article::orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'author', 'created_at'])
                ->toArray()
        ];
    }
}