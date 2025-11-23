import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDuplicates, scanForDuplicates, getFileDuplicates } from '../api/duplicates';

export function useDuplicates() {
  return useQuery({
    queryKey: ['duplicates'],
    queryFn: getAllDuplicates,
  });
}

export function useScanDuplicates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sourcePath: string) => scanForDuplicates(sourcePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
  });
}

export function useFileDuplicates(fileId: number) {
  return useQuery({
    queryKey: ['duplicates', fileId],
    queryFn: () => getFileDuplicates(fileId),
    enabled: !!fileId,
  });
}