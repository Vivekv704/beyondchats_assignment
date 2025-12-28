<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Article extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'author',
        'publication_date',
        'content',
        'category',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'publication_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [];

    /**
     * Get the validation rules for the model.
     *
     * @return array<string, string>
     */
    public static function validationRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publication_date' => 'nullable|date',
            'content' => 'required|string',
            'category' => 'nullable|string|max:100',
        ];
    }

    /**
     * Get the validation rules for updating the model.
     *
     * @return array<string, string>
     */
    public static function updateValidationRules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'author' => 'sometimes|required|string|max:255',
            'publication_date' => 'nullable|date',
            'content' => 'sometimes|required|string',
            'category' => 'nullable|string|max:100',
        ];
    }
}
