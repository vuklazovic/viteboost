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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Grid3X3,
  Grid2X2,
  List,
  ImageIcon,
  Clock,
  CheckCircle2,
  Star,
  SortAsc,
  SortDesc,
  RefreshCw,
  X
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

  const { data: generations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['generations'],
    queryFn: getUserGenerations,
    refetchOnWindowFocus: false
  });

  const filteredAndSortedGenerations = useMemo(() => {
    let filtered = [...generations];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gen =>
        gen.original_filename.toLowerCase().includes(query) ||
        gen.generation_id.toLowerCase().includes(query)
      );
    }

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
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6';
      case 'grid-small':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4';
      case 'list':
        return 'space-y-2';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6';
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

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
      <Card className="p-12 text-center">
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Generations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedGenerations.length} of {generations.length} generations
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  {viewMode === 'grid-large' && <Grid3X3 className="h-4 w-4" />}
                  {viewMode === 'grid-small' && <Grid2X2 className="h-4 w-4" />}
                  {viewMode === 'list' && <List className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'grid-large'}
                  onCheckedChange={() => setViewMode('grid-large')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Large Grid
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'grid-small'}
                  onCheckedChange={() => setViewMode('grid-small')}
                >
                  <Grid2X2 className="h-4 w-4 mr-2" />
                  Small Grid
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'list'}
                  onCheckedChange={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant={viewMode === 'grid-large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid-large')}
                className="h-9 w-9 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid-small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid-small')}
                className="h-9 w-9 p-0"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-9 w-9 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search generations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-36">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 whitespace-nowrap">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {filterBy !== 'all' && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
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
                  <X className="h-4 w-4 mr-2 text-red-600" />
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
          </div>
        </div>

        {(searchQuery || filterBy !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="gap-2">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:bg-muted rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterBy !== 'all' && (
              <Badge variant="outline" className="gap-2">
                Filter: {filterBy}
                <button
                  onClick={() => setFilterBy('all')}
                  className="ml-1 hover:bg-muted rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {filteredAndSortedGenerations.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
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