'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface HistoryFiltersProps {
  actionFilter: string;
  onActionChange: (value: string) => void;
}

const actions = [
  'All',
  'scanned',
  'moved',
  'organized',
  'deleted',
  'undone',
];

export function HistoryFilters({
  actionFilter,
  onActionChange,
}: HistoryFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="action">Action Type</Label>
          <Select value={actionFilter || 'all'} onValueChange={onActionChange}>
            <SelectTrigger id="action">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              {actions.map((action) => (
                <SelectItem key={action} value={action === 'All' ? 'all' : action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

