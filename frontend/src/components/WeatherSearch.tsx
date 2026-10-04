import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, X, AlertCircle } from 'lucide-react';
import type { GeocodingLocation } from '../types/weather';
import { searchLocations } from '../services/weatherService';

interface WeatherSearchProps {
  onSelectLocation: (location: GeocodingLocation) => void;
  selectedLocationName?: string;
  placeholder?: string;
  className?: string;
}

export const WeatherSearch: React.FC<WeatherSearchProps> = ({
  onSelectLocation,
  selectedLocationName,
  placeholder = 'Search location by city or region (Open-Meteo)...',
  className = '',
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const locations = await searchLocations(trimmed, controller.signal);
        setResults(locations);
        setIsOpen(true);
        setHasSearched(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Geocoding search failed');
          setResults([]);
          setIsOpen(true);
          setHasSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (location: GeocodingLocation) => {
    onSelectLocation(location);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
  };

  return (
    <div className={`weather-search-container ${className}`} ref={searchContainerRef}>
      <div className="search-box weather-search-input-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || hasSearched) setIsOpen(true);
          }}
          placeholder={selectedLocationName ? `Active: ${selectedLocationName} (Search new...)` : placeholder}
          className="search-input"
          aria-label="Search weather location"
        />

        {loading && <Loader2 className="search-status-icon spinner" />}
        {!loading && query && (
          <button type="button" onClick={handleClear} className="search-clear-btn" title="Clear search">
            <X className="search-status-icon" />
          </button>
        )}
      </div>

      {/* Geocoding Results Dropdown */}
      {isOpen && (
        <div className="weather-search-dropdown">
          {error && (
            <div className="dropdown-message error-message">
              <AlertCircle className="msg-icon" />
              <span>{error}</span>
            </div>
          )}

          {!error && loading && (
            <div className="dropdown-message loading-message">
              <Loader2 className="msg-icon spinner" />
              <span>Searching Open-Meteo Geocoding database...</span>
            </div>
          )}

          {!error && !loading && hasSearched && results.length === 0 && (
            <div className="dropdown-message empty-message">
              <MapPin className="msg-icon" />
              <span>No matching locations found for &quot;{query}&quot;. Try a different city or region.</span>
            </div>
          )}

          {!error && results.length > 0 && (
            <ul className="search-results-list">
              {results.map((loc) => (
                <li key={`${loc.id}-${loc.latitude}-${loc.longitude}`}>
                  <button
                    type="button"
                    className="search-result-item"
                    onClick={() => handleSelect(loc)}
                  >
                    <MapPin className="result-icon" />
                    <div className="result-details">
                      <span className="result-name">{loc.name}</span>
                      <span className="result-sub">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ')} ({loc.latitude.toFixed(3)}°, {loc.longitude.toFixed(3)}°)
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
