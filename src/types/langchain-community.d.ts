declare module '@langchain/community/document_loaders/fs/excel' {
  import { Document } from 'langchain/document';

  export class ExcelLoader {
    constructor(filePath: string, options?: any);
    load(): Promise<Document[]>;
  }
}
