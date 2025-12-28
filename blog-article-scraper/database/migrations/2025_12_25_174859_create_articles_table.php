<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('author', 255);
            $table->timestamp('publication_date')->nullable();
            $table->text('content');
            $table->string('category', 100)->nullable();
            $table->timestamps();
            
            // Indexes for performance optimization
            $table->index('title');
            $table->index('author');
            $table->index('publication_date');
            $table->index('category');
            
            // Unique constraint to prevent duplicates
            $table->unique(['title', 'publication_date'], 'unique_article');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
