// Test-only private storage, with the same conditional-write contract as Blob.
export class MemoryStore{
 rows=new Map();revision=0;
 async listFamilies(cursor){const paths=[...this.rows.keys()].filter(p=>p.startsWith('families/')).sort(),at=Number(cursor??0);return {paths:paths.slice(at,at+20),cursor:at+20<paths.length?String(at+20):undefined};}
 async read(path){return structuredClone(this.rows.get(path)??null);}
 async write(path,value,etag){const old=this.rows.get(path);if(old?old.etag!==etag:etag!==undefined){const e=Error('conflict');e.status=412;throw e;}const next={value:structuredClone(value),etag:String(++this.revision)};this.rows.set(path,next);return next;}
}
