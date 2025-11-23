import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePath } from '@/lib/api/files';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
}

export function PathInput({ 
  label, 
  value, 
  onChange, 
  onValidationChange,
  placeholder,
  required = false
}: PathInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!value) {
        setIsValid(null);
        setError(null);
        onValidationChange?.(false);
        return;
      }

      setIsValidating(true);
      try {
        const result = await validatePath(value);
        setIsValid(result.valid);
        setError(result.error || null);
        onValidationChange?.(result.valid);
      } catch (err) {
        setIsValid(false);
        setError('Validation failed');
        onValidationChange?.(false);
      } finally {
        setIsValidating(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [value]); // Removed onValidationChange from dependency array to avoid loops if it's not stable

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            isValid === true && "border-green-500 focus-visible:ring-green-500",
            isValid === false && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        <div className="absolute right-3 top-2.5 text-muted-foreground">
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isValid === true ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : isValid === false ? (
            <X className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
