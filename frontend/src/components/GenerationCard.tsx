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
  const [imageLoaded, setImageLoaded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200/50';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200/50';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200/50';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200/50';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200/50';
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
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-medium ${
          isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
        }`}
        onClick={handleCardClick}
      >
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {generation.thumbnail_url ? (
            <>
              <img
                src={generation.thumbnail_url}
                alt={`Generation from ${generation.original_filename}`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{generation.original_filename}</h4>
            <Badge className={`${getStatusColor(generation.status)} text-xs border`}>
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

        {showActions && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(generation.generation_id);
            }}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-strong hover:-translate-y-1 overflow-hidden ${
        isSelected ? 'ring-2 ring-primary shadow-strong' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {generation.thumbnail_url ? (
          <>
            <img
              src={generation.thumbnail_url}
              alt={`Generation from ${generation.original_filename}`}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(generation.status)} border backdrop-blur-sm font-medium`}>
            {getStatusIcon(generation.status)}
            <span className="ml-1">{generation.status}</span>
          </Badge>
        </div>

        {showActions && (
          <div className="absolute top-3 right-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(generation.generation_id);
              }}
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 backdrop-blur-sm transition-all duration-300 ${
                isFavorite ? 'opacity-100 text-yellow-500 hover:text-yellow-600' : 'opacity-0 group-hover:opacity-100 text-white hover:text-yellow-500'
              }`}
            >
              {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {showActions && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(generation.generation_id);
              }}
              variant="secondary"
              size="sm"
              className="h-9 w-9 p-0 bg-white/90 hover:bg-white shadow-medium"
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
              className="h-9 w-9 p-0 bg-white/90 hover:bg-white shadow-medium"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-strong">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-2">
              {generation.original_filename}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(generation.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{generation.generated_count} images</span>
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
      </div>
    </Card>
  );
};

export default GenerationCard;