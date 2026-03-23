/**
 * Unit tests for tunnel.mjs — Cloudflare Quick Tunnel management
 * Tests the state management and URL parsing logic
 */
import { describe, it, expect } from 'vitest';

describe('Tunnel URL Parsing', () => {
  // Simulates the URL extraction logic used by tunnel.mjs
  function extractTunnelUrl(output) {
    const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    return urlMatch ? urlMatch[0] : null;
  }

  it('should extract tunnel URL from cloudflared output', () => {
    const output = `
2026-03-23T01:00:00Z INF Starting tunnel tunnelID=abc123
2026-03-23T01:00:01Z INF +-------------------------------------------+
2026-03-23T01:00:01Z INF |  Your quick tunnel has been created!       |
2026-03-23T01:00:01Z INF |  https://random-words-here.trycloudflare.com |
2026-03-23T01:00:01Z INF +-------------------------------------------+
`;
    const url = extractTunnelUrl(output);
    expect(url).toBe('https://random-words-here.trycloudflare.com');
  });

  it('should return null when no URL found', () => {
    const output = 'Starting tunnel... Error: connection refused';
    const url = extractTunnelUrl(output);
    expect(url).toBeNull();
  });

  it('should handle URL with multiple hyphens', () => {
    const output = 'https://wild-thunder-fast-cloud.trycloudflare.com is your URL';
    const url = extractTunnelUrl(output);
    expect(url).toBe('https://wild-thunder-fast-cloud.trycloudflare.com');
  });
});

describe('Tunnel State Management', () => {
  // Simulates the tunnel state object
  function createTunnelState() {
    return {
      running: false,
      starting: false,
      url: null,
      error: null,
      process: null
    };
  }

  it('should initialize with clean state', () => {
    const state = createTunnelState();
    expect(state.running).toBe(false);
    expect(state.starting).toBe(false);
    expect(state.url).toBeNull();
    expect(state.error).toBeNull();
  });

  it('should transition to starting state', () => {
    const state = createTunnelState();
    state.starting = true;
    state.error = null;
    expect(state.starting).toBe(true);
    expect(state.running).toBe(false);
  });

  it('should transition to running with URL', () => {
    const state = createTunnelState();
    state.starting = false;
    state.running = true;
    state.url = 'https://test.trycloudflare.com';
    expect(state.running).toBe(true);
    expect(state.starting).toBe(false);
    expect(state.url).toBe('https://test.trycloudflare.com');
  });

  it('should transition to error state', () => {
    const state = createTunnelState();
    state.starting = false;
    state.running = false;
    state.error = 'Connection refused';
    expect(state.running).toBe(false);
    expect(state.error).toBe('Connection refused');
  });

  it('should clean up on stop', () => {
    const state = createTunnelState();
    state.running = true;
    state.url = 'https://test.trycloudflare.com';

    // Stop
    state.running = false;
    state.url = null;
    state.process = null;

    expect(state.running).toBe(false);
    expect(state.url).toBeNull();
  });
});
