<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow all users for now
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'author' => 'sometimes|required|string|max:255',
            'publication_date' => 'nullable|date',
            'content' => 'sometimes|required|string|min:10',
            'category' => 'nullable|string|max:100',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The article title is required when provided.',
            'title.max' => 'The article title cannot exceed 255 characters.',
            'author.required' => 'The author name is required when provided.',
            'author.max' => 'The author name cannot exceed 255 characters.',
            'publication_date.date' => 'The publication date must be a valid date.',
            'content.required' => 'The article content is required when provided.',
            'content.min' => 'The article content must be at least 10 characters long.',
            'category.max' => 'The category cannot exceed 100 characters.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'article title',
            'author' => 'author name',
            'publication_date' => 'publication date',
            'content' => 'article content',
            'category' => 'article category',
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param Validator $validator
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
