import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Upload,
  Grid3X3,
  Star,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnhancedUploadZone from "@/components/EnhancedUploadZone";
import GenerationGrid from "@/components/GenerationGrid";
import GenerationPanel from "@/components/GenerationPanel";
import { GeneratedImage, getUserGenerations } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'generating' | 'completed' | 'error';
  progress: number;
  generatedImages?: GeneratedImage[];
  generationId?: string;
  error?: string;
}

const Generate = () => {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);

  const queryClient = useQueryClient();
  const { user, session, credits, refreshCreditsImmediate, loading, authReady } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch generations for smart initial state
  const { data: generations = [], isLoading } = useQuery({
    queryKey: ['generations'],
    queryFn: getUserGenerations,
    enabled: !!user && !!session?.access_token && authReady && !loading, // Wait for auth and loading complete
    refetchOnWindowFocus: false,
    retry: 1, // Reduce retries to prevent spam
    staleTime: 30000 // Cache for 30 seconds to reduce requests
  });

  // Compute recent generations for sidebar preview
  useEffect(() => {
    if (!isLoading && generations.length > 0) {
      setRecentGenerations(generations.slice(0, 3));
    } else {
      setRecentGenerations([]);
    }
  }, [generations, isLoading]);

  // Handle payment success feedback
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment');
    if (paymentSuccess === 'success' && user && session?.access_token && authReady && !loading) {
      console.log('🎉 Payment success detected, refreshing credits...');

      // Clear any cached credits to force fresh fetch
      localStorage.removeItem('auth_credits');

      // Wait a bit for webhook to process, then refresh credits with retry
      const refreshCreditsWithRetry = async (attempt = 1, maxAttempts = 3) => {
        try {
          await refreshCreditsImmediate();
          console.log('✅ Credits refreshed after payment');
          toast.success('🎉 Payment successful! Your subscription is now active and your credits have been updated.');
        } catch (error) {
          console.error(`❌ Failed to refresh credits (attempt ${attempt}):`, error);

          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying credit refresh in 3 seconds (attempt ${attempt + 1}/${maxAttempts})`);
            setTimeout(() => refreshCreditsWithRetry(attempt + 1, maxAttempts), 3000);
          } else {
            toast.error('Payment successful, but failed to refresh credits. Please refresh the page.');
          }
        }
      };

      setTimeout(() => refreshCreditsWithRetry(), 2000); // Wait 2 seconds for webhook processing

      // Remove payment parameter from URL immediately to prevent re-runs
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('payment');
      newSearchParams.delete('session_id');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams.get('payment'), user, session?.access_token, authReady, loading]); // Wait for auth to be ready

  // Handle new images generated
  const handleImagesGenerated = (images: GeneratedImage[], uploadId: string, generationId?: string) => {
    toast.success(`✨ Generated ${images.length} stunning variations!`);

    // Invalidate generations query to refresh data
    queryClient.invalidateQueries({ queryKey: ['generations'] });
  };

  // Handle queue updates
  const handleQueueUpdate = (queue: UploadItem[]) => {
    setUploadQueue(queue);
  };

  // Generation actions
  const handleSelectGeneration = (generationId: string) => {
    // Always show in All tab inline view
    setActiveTab('all');
    setSelectedGenerationId(generationId);
    setIsPanelOpen(false);
  };

  const handleViewGeneration = (generationId: string) => {
    // Used by upload queue + recent preview: go to All and show inline
    setActiveTab('all');
    setSelectedGenerationId(generationId);
    setIsPanelOpen(false);
  };

  const handleToggleFavorite = (generationId: string) => {
    setFavorites(prev =>
      prev.includes(generationId)
        ? prev.filter(id => id !== generationId)
        : [...prev, generationId]
    );
    toast.success(
      favorites.includes(generationId)
        ? '💔 Removed from favorites'
        : '⭐ Added to favorites'
    );
  };

  const handleDeleteGeneration = (generationId: string) => {
    // TODO: Implement delete functionality
    toast.success('🗑️ Generation deleted');
    queryClient.invalidateQueries({ queryKey: ['generations'] });
  };

  const handleShareGeneration = (generationId: string) => {
    const shareUrl = `${window.location.origin}/generate?gen=${generationId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('🔗 Share link copied to clipboard');
  };

  // Get stats for dashboard
  const getStats = () => {
    const total = generations.length;
    const completed = generations.filter(g => g.status === 'completed').length;
    const pending = generations.filter(g => g.status === 'pending').length;
    const favCount = favorites.length;
    const queueCount = uploadQueue.length;

    return { total, completed, pending, favCount, queueCount };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                AI Generation
                <span className="bg-gradient-primary bg-clip-text text-transparent"> Studio</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Transform your product images with AI-powered variations that boost conversions and engagement.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 lg:flex-col lg:items-end">
              {/* <Card className="p-4 min-w-32">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{credits ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Credits Left</div>
                </div>
              </Card> */}
  

              <Card className="p-4 min-w-32">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Generations</div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Upload Area */}
              <div className="lg:col-span-2">
                <EnhancedUploadZone
                  onImagesGenerated={handleImagesGenerated}
                  onQueueUpdate={handleQueueUpdate}
                  onOpenGeneration={handleViewGeneration}
                />
              </div>

              {/* Sidebar Info */
              }
              <div className="space-y-6">
                {/* Quick Stats
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Queue</span>
                      <Badge variant={stats.queueCount > 0 ? "default" : "secondary"}>
                        {stats.queueCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Completed</span>
                      <Badge variant="outline">{stats.completed}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pending</span>
                      <Badge variant="outline">{stats.pending}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Favorites</span>
                      <Badge variant="outline" className="text-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        {stats.favCount}
                      </Badge>
                    </div>
                  </div>
                </Card> */}

                {/* Pro Tips */}

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pro Tips
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>High-resolution images (1024x1024+) produce better results</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Products with clear backgrounds work best</span>
                    </div>
                  </div>
                </Card>

                {/* Recent Generations Preview (under Pro Tips) */}
                {recentGenerations.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Recent Generations</h3>
                      <Button
                        onClick={() => setActiveTab('all')}
                        variant="ghost"
                        size="sm"
                      >
                        View All
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {recentGenerations.slice(0, 3).map((gen) => (
                        <div
                          key={gen.generation_id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleViewGeneration(gen.generation_id)}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {gen.thumbnail_url ? (
                              <img
                                src={gen.thumbnail_url}
                                alt={gen.original_filename}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {gen.original_filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {gen.generated_count} images • {formatDate(gen.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Recent tab removed */}

          {/* All Generations Tab */}
          <TabsContent value="all" className="space-y-6">
            {selectedGenerationId ? (
              <GenerationPanel
                generationId={selectedGenerationId}
                isOpen={true}
                inline={true}
                onClose={() => setSelectedGenerationId(null)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favorites.includes(selectedGenerationId)}
              />
            ) : (
              <GenerationGrid
                selectedGenerationId={selectedGenerationId}
                onSelectGeneration={handleSelectGeneration}
                onViewGeneration={handleViewGeneration}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onDeleteGeneration={handleDeleteGeneration}
                onShareGeneration={handleShareGeneration}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Generation Detail Panel (not used for All tab) */}
      <GenerationPanel
        generationId={selectedGenerationId}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedGenerationId(null);
        }}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedGenerationId ? favorites.includes(selectedGenerationId) : false}
      />

      <Footer />
    </div>
  );
};

export default Generate;
