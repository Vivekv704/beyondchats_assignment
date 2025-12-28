<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Exception;
use Illuminate\Support\Facades\Log;

class ArticleScraperService
{
    /**
     * Scrape article data from HTML content.
     *
     * @param string $html
     * @return array
     * @throws Exception
     */
    public function scrapeArticle(string $html): array
    {
        try {
            // Create DOMDocument and load HTML
            $dom = new DOMDocument();
            
            // Suppress warnings for malformed HTML
            libxml_use_internal_errors(true);
            
            // Load HTML content
            $dom->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            
            // Clear libxml errors
            libxml_clear_errors();
            
            // Extract article data
            $articleData = [
                'title' => $this->extractTitle($dom),
                'author' => $this->extractAuthor($dom),
                'publication_date' => $this->extractDate($dom),
                'content' => $this->extractContent($dom),
                'category' => $this->extractCategory($dom),
            ];
            
            // Validate that required fields are present
            if (empty($articleData['title']) || empty($articleData['content'])) {
                throw new Exception('Required fields (title or content) are missing from HTML');
            }
            
            return $articleData;
            
        } catch (Exception $e) {
            Log::error('HTML scraping failed', [
                'error' => $e->getMessage(),
                'html_length' => strlen($html)
            ]);
            
            throw new Exception('Failed to scrape article data: ' . $e->getMessage());
        }
    }

    /**
     * Extract article title from DOM.
     *
     * @param DOMDocument $dom
     * @return string|null
     */
    protected function extractTitle(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        
        // Try multiple selectors for title
        $titleSelectors = [
            '//h1[@class="entry-title"]',
            '//h1[@class="post-title"]',
            '//h1[@class="article-title"]',
            '//h1[contains(@class, "title")]',
            '//title',
            '//h1',
            '//h2[contains(@class, "title")]'
        ];
        
        foreach ($titleSelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $title = trim($nodes->item(0)->textContent);
                if (!empty($title)) {
                    return $this->sanitizeText($title);
                }
            }
        }
        
        return null;
    }

    /**
     * Extract author name from DOM.
     *
     * @param DOMDocument $dom
     * @return string|null
     */
    protected function extractAuthor(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        
        // Try multiple selectors for author
        $authorSelectors = [
            '//span[@class="author"]',
            '//div[@class="author"]',
            '//p[@class="author"]',
            '//span[contains(@class, "author")]',
            '//div[contains(@class, "author")]',
            '//*[@class="byline"]',
            '//*[contains(@class, "byline")]',
            '//meta[@name="author"]/@content'
        ];
        
        foreach ($authorSelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $author = trim($nodes->item(0)->textContent ?? $nodes->item(0)->nodeValue);
                if (!empty($author)) {
                    return $this->sanitizeText($author);
                }
            }
        }
        
        return 'Unknown Author';
    }

    /**
     * Extract publication date from DOM.
     *
     * @param DOMDocument $dom
     * @return string|null
     */
    protected function extractDate(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        
        // Try multiple selectors for date
        $dateSelectors = [
            '//time/@datetime',
            '//span[@class="date"]',
            '//div[@class="date"]',
            '//p[@class="date"]',
            '//span[contains(@class, "date")]',
            '//div[contains(@class, "date")]',
            '//meta[@property="article:published_time"]/@content',
            '//meta[@name="date"]/@content'
        ];
        
        foreach ($dateSelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $date = trim($nodes->item(0)->textContent ?? $nodes->item(0)->nodeValue);
                if (!empty($date)) {
                    // Try to parse and format the date
                    try {
                        $parsedDate = new \DateTime($date);
                        return $parsedDate->format('Y-m-d H:i:s');
                    } catch (Exception $e) {
                        // If parsing fails, continue to next selector
                        continue;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Extract article content from DOM.
     *
     * @param DOMDocument $dom
     * @return string|null
     */
    protected function extractContent(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        
        // Try multiple selectors for content
        $contentSelectors = [
            '//div[@class="entry-content"]',
            '//div[@class="post-content"]',
            '//div[@class="article-content"]',
            '//div[contains(@class, "content")]',
            '//article//div[contains(@class, "content")]',
            '//main//div[contains(@class, "content")]',
            '//article',
            '//main'
        ];
        
        foreach ($contentSelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $content = trim($nodes->item(0)->textContent);
                if (!empty($content) && strlen($content) > 100) { // Ensure substantial content
                    return $this->sanitizeText($content);
                }
            }
        }
        
        return null;
    }

    /**
     * Extract article category from DOM.
     *
     * @param DOMDocument $dom
     * @return string|null
     */
    protected function extractCategory(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        
        // Try multiple selectors for category
        $categorySelectors = [
            '//span[@class="category"]',
            '//div[@class="category"]',
            '//p[@class="category"]',
            '//span[contains(@class, "category")]',
            '//div[contains(@class, "category")]',
            '//nav//a[contains(@class, "category")]',
            '//meta[@property="article:section"]/@content'
        ];
        
        foreach ($categorySelectors as $selector) {
            $nodes = $xpath->query($selector);
            if ($nodes && $nodes->length > 0) {
                $category = trim($nodes->item(0)->textContent ?? $nodes->item(0)->nodeValue);
                if (!empty($category)) {
                    return $this->sanitizeText($category);
                }
            }
        }
        
        return null;
    }

    /**
     * Sanitize extracted text content.
     *
     * @param string $text
     * @return string
     */
    protected function sanitizeText(string $text): string
    {
        // Remove extra whitespace and normalize
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Remove HTML entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Strip any remaining HTML tags
        $text = strip_tags($text);
        
        return $text;
    }
}