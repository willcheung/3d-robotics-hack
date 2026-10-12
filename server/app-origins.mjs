// Two explicit workshop origins allow a domain migration without invalidating
// sessions on the original host. Never accept an origin supplied by a request.
export function appOrigins(primary,alternate){
 const origins=[primary,...(alternate?[alternate]:[])];
 for(const raw of origins){const url=new URL(raw);if(raw.includes('*')||raw!==url.origin||url.username||url.password||!['http:','https:'].includes(url.protocol)||(!['127.0.0.1','localhost'].includes(url.hostname)&&url.protocol!=='https:'))throw Error('Invalid workshop origin');}
 return [...new Set(origins)];
}
