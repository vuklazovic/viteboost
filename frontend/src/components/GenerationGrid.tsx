import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Grid3X3,
  Grid2X2,
  List,
  Calendar,
  ImageIcon,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Generation, getUserGenerations } from '@/lib/api';
import GenerationCard from './GenerationCard';

interface GenerationGridProps {
  selectedGenerationId?: string;
  onSelectGeneration?: (generationId: string) => void;
  onViewGeneration?: (generationId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (generationId: string) => void;
  onDeleteGeneration?: (generationId: string) => void;
  onShareGeneration?: (generationId: string) => void;
}

type ViewMode = 'grid-large' | 'grid-small' | 'list';
type SortOption = 'newest' | 'oldest' | 'name' | 'images';
type FilterOption = 'all' | 'completed' | 'pending' | 'failed' | 'favorites';

const GenerationGrid = ({
  selectedGenerationId,
  onSelectGeneration,
  onViewGeneration,
  favorites = [],
  onToggleFavorite,
  onDeleteGeneration,
  onShareGeneration
}: GenerationGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-large');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: generations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['generations'],
    queryFn: getUserGenerations,
    refetchOnWindowFocus: false
  });

  // Filter and sort generations
  const filteredAndSortedGenerations = useMemo(() => {
    let filtered = [...generations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gen =>
        gen.original_filename.toLowerCase().includes(query) ||
        gen.generation_id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'completed':
        filtered = filtered.filter(gen => gen.status === 'completed');
        break;
      case 'pending':
        filtered = filtered.filter(gen => gen.status === 'pending');
        break;
      case 'failed':
        filtered = filtered.filter(gen => gen.status === 'failed');
        break;
      case 'favorites':
        filtered = filtered.filter(gen => favorites.includes(gen.generation_id));
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.original_filename.localeCompare(b.original_filename));
        break;
      case 'images':
        filtered.sort((a, b) => b.generated_count - a.generated_count);
        break;
    }

    return filtered;
  }, [generations, searchQuery, filterBy, sortBy, favorites]);

  const getGridClassName = () => {
    switch (viewMode) {
      case 'grid-large':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
      case 'grid-small':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4';
      case 'list':
        return 'space-y-2';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: generations.length,
      completed: generations.filter(g => g.status === 'completed').length,
      pending: generations.filter(g => g.status === 'pending').length,
      failed: generations.filter(g => g.status === 'failed').length,
      favorites: generations.filter(g => favorites.includes(g.generation_id)).length
    };
    return stats;
  };

  const stats = getStatusStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className={getGridClassName()}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Failed to load generations</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your generations. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (generations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No generations yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload your first image to start generating amazing variations with AI.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Generations</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedGenerations.length} of {generations.length} generations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search generations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Newest
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Oldest
                </div>
              </SelectItem>
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Name
                </div>
              </SelectItem>
              <SelectItem value="images">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {filterBy !== 'all' && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={filterBy === 'all'}
                onCheckedChange={() => setFilterBy('all')}
              >
                All Generations ({stats.total})
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterBy === 'completed'}
                onCheckedChange={() => setFilterBy('completed')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Completed ({stats.completed})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterBy === 'pending'}
                onCheckedChange={() => setFilterBy('pending')}
              >
                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                Pending ({stats.pending})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterBy === 'failed'}
                onCheckedChange={() => setFilterBy('failed')}
              >
                <TrendingUp className="h-4 w-4 mr-2 text-red-600" />
                Failed ({stats.failed})
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterBy === 'favorites'}
                onCheckedChange={() => setFilterBy('favorites')}
              >
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                Favorites ({stats.favorites})
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {viewMode === 'grid-large' && <Grid3X3 className="h-4 w-4" />}
                {viewMode === 'grid-small' && <Grid2X2 className="h-4 w-4" />}
                {viewMode === 'list' && <List className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode('grid-large')}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Large Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('grid-small')}>
                <Grid2X2 className="h-4 w-4 mr-2" />
                Small Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List className="h-4 w-4 mr-2" />
                List View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar */}
      {(searchQuery || filterBy !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="outline">
              Search: "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filterBy !== 'all' && (
            <Badge variant="outline">
              Filter: {filterBy}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setFilterBy('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      {filteredAndSortedGenerations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  size="sm"
                >
                  Clear Search
                </Button>
                <Button
                  onClick={() => setFilterBy('all')}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className={getGridClassName()}>
          {filteredAndSortedGenerations.map((generation) => (
            <GenerationCard
              key={generation.generation_id}
              generation={generation}
              isSelected={selectedGenerationId === generation.generation_id}
              isFavorite={favorites.includes(generation.generation_id)}
              onSelect={onSelectGeneration}
              onView={onViewGeneration}
              onDelete={onDeleteGeneration}
              onToggleFavorite={onToggleFavorite}
              onShare={onShareGeneration}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationGrid;