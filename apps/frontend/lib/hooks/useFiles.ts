import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classifyFiles, getAllFiles, organizeFiles, scanFiles } from "../api/files";
import { getJobStatus } from "../api/jobs";

export function useScanFiles(path: string, extension?: string, sortBy?: string) {
return useQuery({
queryKey:['scan',path,extension,sortBy],
queryFn:() => scanFiles(path,extension,sortBy),
enabled: !!path,
})
}


export function useClassifyFiles(path:string){
    return useQuery({
        queryKey:['classify',path],
        queryFn:() => classifyFiles(path),
        enabled: !!path,
    })
}

export function useAllFiles() {
    return useQuery({
      queryKey: ['files'],
      queryFn: getAllFiles,
    });
  }

  export function useOrganizeFiles() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ sourcePath, targetPath }: { sourcePath: string; targetPath: string }) =>
        organizeFiles(sourcePath, targetPath),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['files'] });
      },
    });
  }


  export function useJobStatus(jobId: string | null, enabled = true) {
    return useQuery({
      queryKey: ['job', jobId],
      queryFn: () => getJobStatus(jobId!),
      enabled: enabled && !!jobId,
      refetchInterval: (query) => {
        const job = query.state.data;
        // Poll every 2 seconds if job is active or waiting
        if (job?.state === 'active' || job?.state === 'waiting') {
          return 2000;
        }
        // Stop polling if completed or failed
        return false;
      },
    });
  }
