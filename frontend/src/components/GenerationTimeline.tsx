import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Calendar, ImageIcon, Clock, CheckCircle2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Generation, getUserGenerations } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface GenerationTimelineProps {
  selectedGenerationId?: string;
  onSelectGeneration?: (generationId: string) => void;
  onNewGeneration?: () => void;
}

const GenerationTimeline = ({
  selectedGenerationId,
  onSelectGeneration,
  onNewGeneration
}: GenerationTimelineProps) => {
  const { data: generations = [], isLoading, error } = useQuery({
    queryKey: ['generations'],
    queryFn: getUserGenerations,
    refetchOnWindowFocus: false
  });

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-6 px-4 bg-background border-b">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Generation History</h3>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="min-w-[280px] p-4">
                  <Skeleton className="w-full h-32 mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-6 px-4 bg-background border-b">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Generation History</h3>
          </div>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load generation history</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4 bg-gradient-to-r from-background to-muted/20 border-b shadow-sm">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Generation History</h3>
            {generations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {generations.length}
              </Badge>
            )}
          </div>
          <Button
            onClick={onNewGeneration}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Generation
          </Button>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {generations.length === 0 ? (
              <Card
                className="min-w-[320px] p-8 text-center cursor-pointer hover:shadow-medium transition-all duration-300 border-2 border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
                onClick={onNewGeneration}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Create Your First Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload an image and let AI create amazing variations
                    </p>
                  </div>
                  <Button variant="cta" size="sm">
                    Get Started
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {generations.map((generation) => (
                  <Card
                    key={generation.generation_id}
                    className={`min-w-[280px] cursor-pointer transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${
                      selectedGenerationId === generation.generation_id
                        ? 'ring-2 ring-primary shadow-strong'
                        : 'hover:shadow-medium'
                    }`}
                    onClick={() => onSelectGeneration?.(generation.generation_id)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      {generation.thumbnail_url ? (
                        <img
                          src={generation.thumbnail_url}
                          alt={`Generation from ${generation.original_filename}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`${getStatusColor(generation.status)} border text-xs font-medium`}>
                          {generation.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {generation.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {generation.status}
                        </Badge>
                      </div>

                      {/* Selection Indicator */}
                      {selectedGenerationId === generation.generation_id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {generation.original_filename}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(generation.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {generation.generated_count} images
                        </Badge>

                        {selectedGenerationId === generation.generation_id && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Add New Generation Card */}
                <Card
                  className="min-w-[200px] p-6 text-center cursor-pointer hover:shadow-medium transition-all duration-300 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/30 hover:bg-primary/5"
                  onClick={onNewGeneration}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">New Generation</h4>
                      <p className="text-xs text-muted-foreground">Create more variations</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default GenerationTimeline;