import { useSearchParams } from "react-router-dom";
import { useSearch } from "../../shared/hooks/useSearch";

export default function SearchPage({ className = '' }) {
    const [searchParams] = useSearchParams();

    const query = searchParams.get('q');
    const activeFilter = searchParams.get('filter') || 'all';

    // Pass 0 as the debounce time so it executes the search immediately
    const { results, isSearching } = useSearch(query, activeFilter, 0);

    return (
        <div className={`text-body p-80 ${className}`}>
            <h1>Search for {query}</h1>
            {isSearching ? (
                <p>Loading...</p>
            ) : (
                <p>Found {results?.length || 0} results.</p>
            )}
        </div>
    )
}
