import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllDuplicates, scanForDuplicates, getFileDuplicates } from '../api/duplicates';
import { getJobStatus } from '../api/jobs';

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

export function useFileDuplicates(fileId: number | null) {
  return useQuery({
    queryKey: ['file-duplicates', fileId],
    queryFn: () => getFileDuplicates(fileId!),
    enabled: !!fileId,
  });
}

export function useDuplicateJobStatus(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['duplicate-job', jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.state === 'active' || job?.state === 'waiting') {
        return 2000;
      }
      return false;
    },
  });
}
