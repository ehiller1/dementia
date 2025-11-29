/**
 * Browser stub for ioredis
 * This module is used in the browser to prevent ioredis from being bundled
 * All Redis operations should happen on the server side via API calls
 */

export default class Redis {
  constructor() {
    console.warn('[ioredis-stub] Redis is not available in the browser. Use API calls instead.');
  }
}

export { Redis };
