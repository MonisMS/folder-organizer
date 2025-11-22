
import { config } from "../config/index.js";
import type { FileInfo } from "../types/type.js";

export function classifyFile(file:FileInfo):string {
    const extension = file.extension.toLowerCase();

    for(const category of config.categories){
        if(category.extensions.includes(extension)){
            return category.targetFolder;
        }

    }
    return 'Others';
}


export function classifyFiles(files: FileInfo[]): Map<string, FileInfo[]> {
const categorized = new Map<string, FileInfo[]>();

for (const file of files){
    const category = classifyFile(file);

    if(!categorized.has(category)){
        categorized.set(category,[]);
}
categorized.get(category)!.push(file);
}

return categorized;
}