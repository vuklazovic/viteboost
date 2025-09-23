import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ImageIcon,
  Clock,
  CheckCircle2,
  MoreVertical,
  Download,
  Eye,
  Share2,
  Copy,
  Trash2,
  Star,
  StarOff,
  ExternalLink,
  Zap
} from "lucide-react";
import { Generation } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface GenerationCardProps {
  generation: Generation;
  isSelected?: boolean;
  isFavorite?: boolean;
  onSelect?: (generationId: string) => void;
  onView?: (generationId: string) => void;
  onDelete?: (generationId: string) => void;
  onToggleFavorite?: (generationId: string) => void;
  onShare?: (generationId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const GenerationCard = ({
  generation,
  isSelected = false,
  isFavorite = false,
  onSelect,
  onView,
  onDelete,
  onToggleFavorite,
  onShare,
  showActions = true,
  compact = false
}: GenerationCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-3 w-3" />;
      case 'failed':
        return <Zap className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(generation.generation_id);
    } else if (onView) {
      onView(generation.generation_id);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(generation.generation_id);
    toast.success('📋 Generation ID copied to clipboard');
  };

  const handleViewExternal = () => {
    if (generation.thumbnail_url) {
      window.open(generation.thumbnail_url, '_blank');
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-medium ${
          isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {generation.thumbnail_url ? (
            <img
              src={generation.thumbnail_url}
              alt={`Generation from ${generation.original_filename}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Loading skeleton */}
          {!imageLoaded && generation.thumbnail_url && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{generation.original_filename}</h4>
            <Badge className={`${getStatusColor(generation.status)} text-xs`}>
              {getStatusIcon(generation.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDate(generation.created_at)}</span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {generation.generated_count}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && isHovered && (
          <div className="flex gap-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(generation.generation_id);
              }}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-strong hover:-translate-y-1 overflow-hidden ${
        isSelected ? 'ring-2 ring-primary shadow-strong' : ''
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden">
        {generation.thumbnail_url ? (
          <img
            src={generation.thumbnail_url}
            alt={`Generation from ${generation.original_filename}`}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-105' : 'scale-100'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Loading skeleton */}
        {!imageLoaded && generation.thumbnail_url && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(generation.status)} border text-xs font-medium backdrop-blur-sm`}>
            {getStatusIcon(generation.status)}
            {generation.status}
          </Badge>
        </div>

        {/* Favorite Button */}
        {showActions && (
          <div className="absolute top-3 right-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(generation.generation_id);
              }}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 backdrop-blur-sm transition-opacity duration-300 ${
                isHovered || isFavorite ? 'opacity-100' : 'opacity-0'
              } ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-white hover:text-yellow-500'}`}
            >
              {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Quick Actions on hover */}
        {showActions && (
          <div className={`absolute bottom-3 right-3 flex gap-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(generation.generation_id);
              }}
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewExternal();
              }}
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-strong">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-1">
              {generation.original_filename}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(generation.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>{generation.generated_count} images</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onView?.(generation.generation_id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(generation.generation_id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyId}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleFavorite?.(generation.generation_id)}>
                  {isFavorite ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Remove Favorite
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Add Favorite
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(generation.generation_id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Generation Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Generation ID: {generation.generation_id.slice(0, 8)}...
          </div>
          {generation.status === 'completed' && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GenerationCard;