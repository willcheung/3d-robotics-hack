// Test-only private storage, with the same conditional-write contract as Blob.
export class MemoryStore{
 rows=new Map();revision=0;
 async read(path){return structuredClone(this.rows.get(path)??null);}
 async write(path,value,etag){const old=this.rows.get(path);if(old?old.etag!==etag:etag!==undefined){const e=Error('conflict');e.status=412;throw e;}const next={value:structuredClone(value),etag:String(++this.revision)};this.rows.set(path,next);return next;}
}
