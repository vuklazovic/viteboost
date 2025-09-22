import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Minus,
  Plus,
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

  // Quick select presets
  const presets = [1, 5, 10, 20, 50];
  const availablePresets = presets.filter(preset => preset <= effectiveMax);

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
    <Card className={`p-6 space-y-6 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Number of Images to Generate</Label>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {localValue} image{localValue !== 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how many AI-generated variations you want (1-{effectiveMax})
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="space-y-4">
        {/* Slider */}
        <div className="space-y-3">
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
            <span>{effectiveMax}</span>
          </div>
        </div>

        {/* Input and Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={decrementQuantity}
            disabled={disabled || localValue <= MIN_IMAGES}
            className="h-10 w-10 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="flex-1 max-w-24">
            <Input
              type="number"
              value={localValue}
              onChange={handleInputChange}
              min={MIN_IMAGES}
              max={effectiveMax}
              disabled={disabled}
              className="text-center"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={incrementQuantity}
            disabled={disabled || localValue >= effectiveMax}
            className="h-10 w-10 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Presets */}
        {availablePresets.length > 1 && (
          <div className="space-y-2">
            <Label className="text-sm">Quick Select:</Label>
            <div className="flex gap-2 flex-wrap">
              {availablePresets.map((preset) => (
                <Button
                  key={preset}
                  variant={localValue === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuantityChange(preset)}
                  disabled={disabled}
                  className="text-xs"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {showCostBreakdown && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Cost Breakdown</Label>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Images to generate:</span>
              <span className="font-medium">{localValue}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Cost per image:</span>
              <span className="font-medium">{costPerImage || 1} credits</span>
            </div>
            <div className="border-t border-muted pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total cost:</span>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-bold text-lg">{totalCost} credits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Status */}
          <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm">Your balance:</span>
              <Badge variant="outline">{credits || 0} credits</Badge>
            </div>
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {canAfford ? 'Sufficient credits' : 'Insufficient credits'}
              </span>
            </div>
          </div>

          {/* Warnings and Info */}
          {!canAfford && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                You need {totalCost - (credits || 0)} more credits to generate {localValue} images.
                {maxAffordable > 0 && (
                  <span className="block mt-1">
                    You can currently afford up to {maxAffordable} images.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {canAfford && totalCost > (credits || 0) * 0.8 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                This will use {Math.round((totalCost / (credits || 1)) * 100)}% of your available credits.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
};

export default ImageQuantitySelector;
