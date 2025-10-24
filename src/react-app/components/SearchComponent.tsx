import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Package, 
  UtensilsCrossed, 
  FileText, 
  Bed,
  Loader2,
  ArrowRight,
  Clock
} from 'lucide-react';
import { apiClient } from '../config/api';
import { envLog } from '../config/environment';
import { formatCurrency, timeAgo } from '../pages/AdminDashboard';

interface SearchResult {
  id: number;
  type: 'staff' | 'inventory' | 'menu' | 'order' | 'room' | 'category';
  title: string;
  subtitle: string;
  description?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface SearchResultsResponse {
  results: SearchResult[];
  totalCount: number;
}

interface SearchComponentProps {
  onSelectResult?: (result: SearchResult, type: string) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchComponent({ 
  onSelectResult, 
  onClose, 
  placeholder = "Search across all data...",
  autoFocus = true 
}: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalCount, setTotalCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setTotalCount(0);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      envLog.dev('🔍 Performing search for:', searchQuery);
      
      const response = await apiClient.get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data: SearchResultsResponse = await response.json();
      
      envLog.dev('✅ Search results:', data);
      
      setResults(data.results || []);
      setTotalCount(data.totalCount || 0);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error: any) {
      envLog.error('❌ Search error:', error);
      setError('Search failed. Please try again.');
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, results, selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result, result.type);
    }
    handleClose();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    if (onClose) {
      onClose();
    }
  };

  const getResultIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'staff':
        return <Users className={iconClass} />;
      case 'inventory':
        return <Package className={iconClass} />;
      case 'menu':
        return <UtensilsCrossed className={iconClass} />;
      case 'category':
        return <UtensilsCrossed className={iconClass} />;
      case 'order':
        return <FileText className={iconClass} />;
      case 'room':
        return <Bed className={iconClass} />;
      default:
        return <Search className={iconClass} />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      staff: 'Staff',
      inventory: 'Inventory',
      menu: 'Menu Item',
      category: 'Category',
      order: 'Order',
      room: 'Room'
    };
    return labels[type] || type;
  };

  const getResultTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      staff: 'text-blue-600 bg-blue-50',
      inventory: 'text-green-600 bg-green-50',
      menu: 'text-yellow-600 bg-yellow-50',
      category: 'text-orange-600 bg-orange-50',
      order: 'text-purple-600 bg-purple-50',
      room: 'text-gray-600 bg-gray-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-3" />
          )}
          {(query || showResults) && (
            <button
              onClick={handleClose}
              className="p-1 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {!error && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Results Header */}
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <div className="text-xs font-medium text-gray-500">
                  Showing {results.length} of {totalCount} results for "{query}"
                </div>
              </div>

              {/* Results List */}
              <div className="py-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-l-2 transition-colors ${
                      selectedIndex === index 
                        ? 'bg-yellow-50 border-l-yellow-400' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg ${getResultTypeColor(result.type)}`}>
                          {getResultIcon(result.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getResultTypeColor(result.type)}`}>
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          {/* Display metadata based on type */}
                          {result.metadata && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              {result.type === 'order' && result.metadata.total_amount && (
                                <span>{formatCurrency(result.metadata.total_amount)}</span>
                              )}
                              {result.type === 'inventory' && result.metadata.current_stock !== undefined && (
                                <span>Stock: {result.metadata.current_stock}</span>
                              )}
                              {result.metadata.created_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {timeAgo(result.metadata.created_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Show more results indicator */}
              {totalCount > results.length && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                  <span className="text-xs text-gray-500">
                    {totalCount - results.length} more results available
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}