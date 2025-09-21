import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  Star
} from "lucide-react";

interface UploadTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectBulk: () => void;
}

const UploadTypeModal = ({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectBulk
}: UploadTypeModalProps) => {
  const handleSingleUpload = () => {
    console.log('UploadTypeModal: Single upload clicked');
    onSelectSingle();
    onClose();
  };

  const handleBulkUpload = () => {
    onSelectBulk();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Choose Upload Type
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-muted-foreground">
            Select how you'd like to generate your product images
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Single Upload Option */}
          <Card
            className="p-8 cursor-pointer hover:shadow-strong transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 group"
            onClick={handleSingleUpload}
          >
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-10 w-10 text-white" />
              </div>

              {/* Title & Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">Single Upload</h3>
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Upload one image and generate multiple variations
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Perfect for testing single products</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Fast processing (~60 seconds)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">3 professional variations</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Individual credit control</span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">~1 minute</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit Cost:</span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="font-medium text-primary">3 credits</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full font-semibold text-lg py-6 group-hover:shadow-medium transition-all duration-300"
                variant="cta"
                size="lg"
                onClick={handleSingleUpload}
              >
                <Upload className="h-5 w-5" />
                Start Single Upload
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          {/* Bulk Upload Option */}
          <Card
            className="p-8 cursor-pointer transition-all duration-300 border-2 border-muted-foreground/30 bg-muted/20 relative overflow-hidden"
            onClick={handleBulkUpload}
          >
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Badge className="bg-orange-500/10 text-orange-700 border-orange-200 text-sm px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </Badge>
            </div>

            <div className="text-center space-y-6 opacity-60">
              {/* Icon */}
              <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
              </div>

              {/* Title & Badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">Bulk Upload</h3>
                  <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Pro Feature
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Upload multiple images at once for batch processing
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">Process up to 50 images at once</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">Bulk pricing discounts</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">CSV export for metadata</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">Priority processing queue</span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">~5-15 minutes</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit Cost:</span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">2.5 per image</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full font-semibold text-lg py-6 cursor-not-allowed"
                disabled
              >
                <FolderOpen className="h-5 w-5" />
                Coming Soon
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-gradient-secondary rounded-xl">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Not sure which to choose?
            </h4>
            <p className="text-sm text-muted-foreground">
              Start with <strong>Single Upload</strong> to test the quality. You can always come back for bulk processing when you're ready to scale!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadTypeModal;