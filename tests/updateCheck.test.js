import { describe, it, expect } from 'vitest';
import { compareVersions, getUpdateCommand, isNewerVersion, parseVersion } from '../src/updateCheck.js';

describe('update check helpers', () => {
    it('parses version prefixes and metadata', () => {
        expect(parseVersion('v2.1.3+build.7')).toEqual([2, 1, 3]);
        expect(parseVersion('2.1.3-beta.1')).toEqual([2, 1, 3]);
    });

    it('compares semantic version numbers', () => {
        expect(compareVersions('2.1.0', '2.0.9')).toBe(1);
        expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
        expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
        expect(isNewerVersion('2.0.1', '2.0.0')).toBe(true);
        expect(isNewerVersion('2.0.0', '2.0.1')).toBe(false);
    });

    it('returns a useful local update command by default', () => {
        expect(getUpdateCommand()).toContain('npm install');
        expect(getUpdateCommand()).toContain('npm run build:dashboard');
    });
});
