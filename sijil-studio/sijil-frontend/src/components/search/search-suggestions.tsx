'use client';

import { useState, useEffect } from 'react';

interface SearchSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  activeIndex: number;
  onSelect: (suggestion: string) => void;
}

export function SearchSuggestions({ 
  suggestions, 
  isLoading, 
  activeIndex, 
  onSelect 
}: SearchSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
        <div className="p-4 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Searching...
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul
      id="search-suggestions"
      role="listbox"
      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion}
          role="option"
          aria-selected={index === activeIndex}
          onClick={() => onSelect(suggestion)}
          className={`px-4 py-3 cursor-pointer flex items-center ${
            index === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-gray-900">{suggestion}</span>
        </li>
      ))}
    </ul>
  );
}
