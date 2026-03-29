import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PathInput } from './PathInput';
import { Loader2, Sparkles } from 'lucide-react';

interface OrganizeFilesHeroProps {
  onPreview: (sourcePath: string, targetPath: string) => void;
  isLoading: boolean;
}

export function OrganizeFilesHero({ onPreview, isLoading }: OrganizeFilesHeroProps) {
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [isSourceValid, setIsSourceValid] = useState(false);
  const [isTargetValid, setIsTargetValid] = useState(false);

  useEffect(() => {
    const savedSource = localStorage.getItem('lastSourcePath');
    const savedTarget = localStorage.getItem('lastTargetPath');
    if (savedSource) setSourcePath(savedSource);
    if (savedTarget) setTargetPath(savedTarget);
  }, []);

  const handleSourceChange = (value: string) => {
    setSourcePath(value);
    localStorage.setItem('lastSourcePath', value);
  };

  const handleTargetChange = (value: string) => {
    setTargetPath(value);
    localStorage.setItem('lastTargetPath', value);
  };

  const handlePreview = () => {
    if (isSourceValid && isTargetValid) {
      onPreview(sourcePath, targetPath);
    }
  };

  const canPreview = isSourceValid && isTargetValid && !isLoading;

  return (
    <Card className="w-full overflow-hidden border-border/60 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Organize Your Files</CardTitle>
            <CardDescription className="mt-0.5">
              Select a source directory to clean up and a target for organized files.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <div className="grid gap-5 md:grid-cols-2">
          <PathInput
            label="Source Directory"
            value={sourcePath}
            onChange={handleSourceChange}
            onValidationChange={setIsSourceValid}
            placeholder="e.g. C:/Users/Name/Downloads"
            required
          />
          <PathInput
            label="Target Directory"
            value={targetPath}
            onChange={handleTargetChange}
            onValidationChange={setIsTargetValid}
            placeholder="e.g. C:/Users/Name/Documents/Organized"
            required
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <p className="text-xs text-muted-foreground">
            Files will be previewed before any changes are made.
          </p>
          <Button
            size="default"
            onClick={handlePreview}
            disabled={!canPreview}
            className="gap-2 transition-all duration-200 hover:shadow-md disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? 'Analyzing…' : 'Preview Organization'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
