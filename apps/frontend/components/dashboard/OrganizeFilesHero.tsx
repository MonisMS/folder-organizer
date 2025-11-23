import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PathInput } from './PathInput';
import { Loader2 } from 'lucide-react';

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

  return (
    <Card className="w-full border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Organize Your Files</CardTitle>
        <CardDescription>
          Select a source directory to clean up and a target directory for organized files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
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
        
        <div className="flex justify-end">
          <Button 
            size="lg" 
            onClick={handlePreview} 
            disabled={!isSourceValid || !isTargetValid || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Preview Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
