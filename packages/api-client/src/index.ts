/** @blowy/api-client — client typé /v1 (fetch + Zod) et aide de synchronisation WS. Sans dépendance serveur. */
export { BlowyClient } from './client.js';
export { BlowyApiError, HttpTransport, type ClientOptions, type CommandOptions } from './http.js';
export { RealtimeSync, WS_PATH, type SocketLike } from './realtime.js';
export * from '@blowy/api-contract';
