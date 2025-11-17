import Fastify from "fastify"
import { scanInfo } from "./services/scannerInfo.js"

interface ScanQuery{
  path:string
}
export async function buildApp(){
const fastify = Fastify({
  logger:true,
})




fastify.get<{Querystring: ScanQuery}>('/scan',async(request,reply) =>{
  const {path} = request.query
  if(!path){
    return reply.status(400).send({error:"Path query parameter is required"})
  }

  const result = await scanInfo(path)
  return reply.send(result)


  
  
})
 fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  return fastify;
}