import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type  { FileInfo } from '@file-manager/shared';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatFileSize } from '@/lib/utils';

interface OrganizationPreviewProps {
  data: {
    totalFiles: number;
    categories: Record<string, FileInfo[]>;
  };
  onOrganize: () => void;
  onCancel: () => void;
  isOrganizing: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function OrganizationPreview({ data, onOrganize, onCancel, isOrganizing }: OrganizationPreviewProps) {
  const chartData = Object.entries(data.categories).map(([name, files]) => ({
    name,
    value: files.length,
    size: files.reduce((acc, file) => acc + file.size, 0)
  })).filter(item => item.value > 0);

  const totalSize = chartData.reduce((acc, item) => acc + item.size, 0);

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Organization Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{data.totalFiles}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Breakdown</h4>
              {chartData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value} files ({formatFileSize(item.size)})</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={onOrganize} disabled={isOrganizing} className="flex-1">
                {isOrganizing ? 'Organizing...' : 'Organize Now'}
              </Button>
              <Button variant="outline" onClick={onCancel} disabled={isOrganizing}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
