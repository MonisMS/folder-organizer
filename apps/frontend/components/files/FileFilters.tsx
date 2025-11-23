'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';

interface FileFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  extensionFilter: string;
  onExtensionChange: (value: string) => void;
}

const categories = [
  'All',
  'Documents',
  'Images',
  'Videos',
  'Audio',
  'Archives',
  'Code',
  'Executables',
  'Others',
];

export function FileFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  extensionFilter,
  onExtensionChange,
}: FileFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter || 'all'} onValueChange={onCategoryChange}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat === 'All' ? 'all' : cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extension">Extension</Label>
            <Input
              id="extension"
              placeholder="e.g., .pdf, .jpg"
              value={extensionFilter}
              onChange={(e) => onExtensionChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

