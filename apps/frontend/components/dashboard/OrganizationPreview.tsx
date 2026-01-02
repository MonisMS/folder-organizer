import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type  { FileInfo } from '@file-manager/shared';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatFileSize } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart */}
          <div className="lg:col-span-1">
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

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{data.totalFiles}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={onOrganize} disabled={isOrganizing} className="flex-1">
                {isOrganizing ? 'Organizing...' : 'Organize Now'}
              </Button>
              <Button variant="outline" onClick={onCancel} disabled={isOrganizing}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Right: Detailed File List */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="font-medium mb-3">Organization Structure</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Files will be organized into the following folders based on their type:
              </p>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {chartData.map((item, index) => {
                  const files = data.categories[item.name] || [];
                  const isExpanded = expandedCategories.has(item.name);

                  return (
                    <Collapsible 
                      key={item.name}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(item.name)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Folder 
                                className="h-4 w-4" 
                                style={{ color: COLORS[index % COLORS.length] }} 
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{item.value} files</span>
                              <span>{formatFileSize(item.size)}</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="bg-muted/30 px-3 py-2 space-y-1">
                            {files.map((file, fileIndex) => (
                              <div 
                                key={fileIndex} 
                                className="flex items-center justify-between py-1.5 px-2 hover:bg-background/50 rounded text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <File className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate" title={file.name}>
                                    {file.name}
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
