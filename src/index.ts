import Fastify from "fastify"
import { scanInfo } from "./services/scannerInfo.js"

interface ScanQuery {
  path: string;
  extension?: string; 
  sortBy?: string;    
}
export async function buildApp(){
const fastify = Fastify({
  logger:true,
})




fastify.get<{Querystring: ScanQuery}>('/scan',async(request,reply) =>{
  const {path, extension, sortBy} = request.query // Get both parameters
  
  if(!path){
    return reply.status(400).send({error:"Path query parameter is required"})
  }

  const result = await scanInfo(path)
  
  
  if (extension) {

    const sortedFiles = result.files.filter(file => file.extension.toLowerCase() === extension.toLowerCase());
    result.files = sortedFiles;
    result.totalFiles = sortedFiles.length;
    
    
  }

  if(sortBy === 'name'){
    result.files.sort((fileA,fileB)=>{
      const nameA = fileA.name.toLowerCase();
      const nameB = fileB.name.toLowerCase();

      if(nameA <nameB) return -1;
      if(nameA >nameB) return 1;
      return 0;
    })
  }
  if(sortBy === 'size'){
     result.files.sort((fileA,fileB)=>{
      const sizeA = fileA.size;
      const sizeB = fileB.size;

      if(sizeA < sizeB) return -1;
      if(sizeA > sizeB) return 1;
      return 0;
    })
  }
  return reply.send(result)
})

 fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  return fastify;
}