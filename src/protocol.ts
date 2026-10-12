import { validateCommand, type Command } from './model.ts';
export const LIMITS = { source: 16000, output: 8192, commands: 2000, messages: 12000, loadMs: 45000, runMs: 20000 };
export type RuntimeMessage = { type: 'ready' } | { type: 'done' } | { type: 'error'; text: string } | { type: 'output'; text: string } | { type: 'command'; id: number; command: Command };
/** Treat every worker field as untrusted, including termination and log messages. */
export function parseMessage(input: unknown): RuntimeMessage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid runtime message.');
  const r = input as Record<string, unknown>;
  if (r.type === 'ready' || r.type === 'done') {
    if (Object.keys(r).length !== 1) throw new Error('Unexpected runtime fields.');
    return r as RuntimeMessage;
  }
  if (r.type === 'error' || r.type === 'output') {
    if (Object.keys(r).length !== 2 || typeof r.text !== 'string' || r.text.length > 8192) throw new Error('Runtime output exceeded its limit.');
    return r as RuntimeMessage;
  }
  if (r.type === 'command') {
    if (Object.keys(r).length !== 3 || !Number.isSafeInteger(r.id) || (r.id as number) < 1) throw new Error('Invalid command sequence.');
    return { type: 'command', id: r.id as number, command: validateCommand(r.command) };
  }
  throw new Error('Unsupported runtime message.');
}
export function permittedOrigin(raw: string, appOrigin: string): string {
  const url = new URL(raw);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((!local && url.protocol !== 'https:') || (local && !['https:', 'http:'].includes(url.protocol)) || url.origin === appOrigin || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Configure a separate HTTPS runtime origin (a different loopback port is allowed locally).');
  return url.origin;
}
