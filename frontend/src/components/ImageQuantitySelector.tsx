import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ImageQuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  showCostBreakdown?: boolean;
  className?: string;
}

const ImageQuantitySelector = ({
  value,
  onChange,
  disabled = false,
  showCostBreakdown = true,
  className = ""
}: ImageQuantitySelectorProps) => {
  const { credits, costPerImage } = useAuth();
  const [localValue, setLocalValue] = useState(value);

  const MIN_IMAGES = 1;
  const MAX_IMAGES = 100;

  // Calculate costs
  const totalCost = localValue * (costPerImage || 1);
  const canAfford = (credits || 0) >= totalCost;
  const maxAffordable = Math.floor((credits || 0) / (costPerImage || 1));
  const effectiveMax = Math.min(MAX_IMAGES, maxAffordable);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle quantity changes
  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(MIN_IMAGES, Math.min(effectiveMax, newQuantity));
    setLocalValue(clampedQuantity);
    onChange(clampedQuantity);
  };

  const handleSliderChange = (values: number[]) => {
    handleQuantityChange(values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || MIN_IMAGES;
    handleQuantityChange(newValue);
  };

  const incrementQuantity = () => {
    handleQuantityChange(localValue + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(localValue - 1);
  };


  const getStatusColor = () => {
    if (!canAfford) return "text-red-600";
    if (totalCost > (credits || 0) * 0.8) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (!canAfford) return <AlertTriangle className="h-4 w-4" />;
    if (totalCost > (credits || 0) * 0.8) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Number of Images</Label>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            {localValue} image{localValue !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[localValue]}
            onValueChange={handleSliderChange}
            min={MIN_IMAGES}
            max={effectiveMax}
            step={1}
            disabled={disabled || effectiveMax < MIN_IMAGES}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_IMAGES}</span>
            <span>{effectiveMax} (max with your credits)</span>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      {showCostBreakdown && (
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Cost: {totalCost} credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Balance:</span>
              <Badge variant={canAfford ? "outline" : "destructive"} className="text-xs">
                {credits || 0}
              </Badge>
            </div>
          </div>

          {/* Warning for insufficient credits */}
          {!canAfford && (
            <Alert className="mt-3 border-red-200 bg-red-50 py-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                Need {totalCost - (credits || 0)} more credits. Max: {maxAffordable} images.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
};

export default ImageQuantitySelector;
