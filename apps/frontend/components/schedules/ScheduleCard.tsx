'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Square, Zap, Calendar } from 'lucide-react';
import type { Schedule } from '@/lib/api/schedules';
import { toast } from 'sonner';

interface ScheduleCardProps {
  schedule: Schedule;
  onToggle: (name: string, enabled: boolean) => void;
  onTrigger: (name: string) => void;
}

export function ScheduleCard({ schedule, onToggle, onTrigger }: ScheduleCardProps) {
  const handleToggle = (checked: boolean) => {
    onToggle(schedule.name, checked);
  };

  const handleTrigger = () => {
    onTrigger(schedule.name);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {schedule.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Pattern: <code className="text-xs">{schedule.pattern}</code>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {schedule.running && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                Running
              </Badge>
            )}
            {!schedule.enabled && (
              <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                Disabled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Timezone:</span>
            <span>{schedule.timezone}</span>
          </div>
          {schedule.nextRun && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Next Run:</span>
              <span>{new Date(schedule.nextRun).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id={`schedule-${schedule.name}`}
              checked={schedule.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor={`schedule-${schedule.name}`}>
              {schedule.enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTrigger}
              disabled={!schedule.enabled}
            >
              <Zap className="mr-2 h-4 w-4" />
              Trigger Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

