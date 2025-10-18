import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DonorAutocomplete = ({ value, onChange, placeholder = "Enter donor name...", disabled = false, style = {} }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        searchDonors(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const searchDonors = async (searchQuery) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/donors/search?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching donors:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (donor) => {
    setQuery(donor.name);
    onChange(donor.name, donor);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '2px solid #ced4da',
          borderRadius: '8px',
          fontSize: '16px',
          boxSizing: 'border-box',
          paddingRight: isLoading ? '40px' : '16px',
          ...style
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6c757d'
        }}>
          ⏳
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid #ced4da',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((donor) => (
            <div
              key={donor.id}
              onClick={() => handleSuggestionClick(donor)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f8f9fa',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                {donor.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6c757d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  {donor.email && `${donor.email} • `}
                  {donor.phone && `${donor.phone} • `}
                  Total: ${parseFloat(donor.totalDonations || 0).toFixed(2)}
                </span>
                {donor.lastDonationDate && (
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    Last: {new Date(donor.lastDonationDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {query.length >= 2 && (
            <div
              onClick={() => handleSuggestionClick({ name: query })}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderTop: '2px solid #dee2e6',
                background: '#f8f9fa',
                fontStyle: 'italic',
                color: '#6c757d'
              }}
            >
              ➕ Add "{query}" as new donor
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonorAutocomplete;