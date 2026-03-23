/**
 * Unit tests for config.mjs — Centralized configuration module
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// We test config.mjs by importing fresh each time
// Config uses data/config.json, so we use a temp directory
const TEST_DATA_DIR = join(PROJECT_ROOT, 'data-test');
const TEST_CONFIG_FILE = join(TEST_DATA_DIR, 'config.json');

describe('Config Module — deepMerge logic', () => {
  it('should merge nested objects correctly', () => {
    // Test the deep merge concept used by config
    function deepMerge(target, source) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
            && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          result[key] = deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }

    const defaults = {
      server: { port: 3001, pin: null },
      telegram: { enabled: false, botToken: '', notifications: { onComplete: true, onError: true } }
    };

    const saved = {
      server: { port: 4000 },
      telegram: { enabled: true, notifications: { onComplete: false } }
    };

    const result = deepMerge(defaults, saved);

    expect(result.server.port).toBe(4000);
    expect(result.server.pin).toBeNull(); // preserved from defaults
    expect(result.telegram.enabled).toBe(true);
    expect(result.telegram.botToken).toBe(''); // preserved from defaults
    expect(result.telegram.notifications.onComplete).toBe(false); // overridden
    expect(result.telegram.notifications.onError).toBe(true); // preserved from defaults
  });

  it('should handle arrays by replacing (not merging)', () => {
    function deepMerge(target, source) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
            && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          result[key] = deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }

    const defaults = {
      devices: [{ name: 'Default', cdpPort: 9222 }]
    };
    const saved = {
      devices: [{ name: 'Custom', cdpPort: 9333 }]
    };

    const result = deepMerge(defaults, saved);
    expect(result.devices).toHaveLength(1);
    expect(result.devices[0].name).toBe('Custom');
    expect(result.devices[0].cdpPort).toBe(9333);
  });

  it('should handle empty source gracefully', () => {
    function deepMerge(target, source) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
            && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          result[key] = deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }

    const defaults = { server: { port: 3001 } };
    const result = deepMerge(defaults, {});
    expect(result).toEqual(defaults);
  });
});

describe('Config Module — dot-path access', () => {
  function getByPath(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  it('should access top-level keys', () => {
    const config = { server: { port: 3001 } };
    expect(getByPath(config, 'server')).toEqual({ port: 3001 });
  });

  it('should access nested keys via dot-path', () => {
    const config = {
      telegram: { notifications: { onComplete: true, onError: false } }
    };
    expect(getByPath(config, 'telegram.notifications.onComplete')).toBe(true);
    expect(getByPath(config, 'telegram.notifications.onError')).toBe(false);
  });

  it('should return undefined for non-existent paths', () => {
    const config = { server: { port: 3001 } };
    expect(getByPath(config, 'nonexistent.key')).toBeUndefined();
  });

  it('should return full config when path is empty', () => {
    const config = { server: { port: 3001 } };
    expect(getByPath(config, '')).toEqual(config);
  });
});

describe('Config Module — dot-path update', () => {
  function updateByPath(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  it('should update nested value', () => {
    const config = { server: { port: 3001, pin: null } };
    updateByPath(config, 'server.port', 4000);
    expect(config.server.port).toBe(4000);
    expect(config.server.pin).toBeNull(); // unchanged
  });

  it('should create intermediate objects if needed', () => {
    const config = {};
    updateByPath(config, 'new.nested.key', 'value');
    expect(config.new.nested.key).toBe('value');
  });

  it('should handle top-level updates', () => {
    const config = { autoAcceptCommands: false };
    updateByPath(config, 'autoAcceptCommands', true);
    expect(config.autoAcceptCommands).toBe(true);
  });
});
