import { describe, it, expect } from 'bun:test';
import { getMimeType } from './fs';

describe('getMimeType', () => {
  describe('JavaScript and web assets', () => {
    it('returns correct type for .js files', () => {
      expect(getMimeType('app.js')).toBe('application/javascript');
    });

    it('returns correct type for .css files', () => {
      expect(getMimeType('styles.css')).toBe('text/css');
    });

    it('returns correct type for .html files', () => {
      expect(getMimeType('index.html')).toBe('text/html');
    });

    it('returns correct type for .json files', () => {
      expect(getMimeType('data.json')).toBe('application/json');
    });
  });

  describe('images', () => {
    it('returns correct type for .svg files', () => {
      expect(getMimeType('icon.svg')).toBe('image/svg+xml');
    });

    it('returns correct type for .png files', () => {
      expect(getMimeType('logo.png')).toBe('image/png');
    });

    it('returns correct type for .jpg files', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    });

    it('returns correct type for .jpeg files', () => {
      expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
    });

    it('returns correct type for .gif files', () => {
      expect(getMimeType('anim.gif')).toBe('image/gif');
    });

    it('returns correct type for .webp files', () => {
      expect(getMimeType('image.webp')).toBe('image/webp');
    });

    it('returns correct type for .ico files', () => {
      expect(getMimeType('favicon.ico')).toBe('image/x-icon');
    });
  });

  describe('fonts', () => {
    it('returns correct type for .woff files', () => {
      expect(getMimeType('font.woff')).toBe('font/woff');
    });

    it('returns correct type for .woff2 files', () => {
      expect(getMimeType('font.woff2')).toBe('font/woff2');
    });

    it('returns correct type for .ttf files', () => {
      expect(getMimeType('font.ttf')).toBe('font/ttf');
    });

    it('returns correct type for .eot files', () => {
      expect(getMimeType('font.eot')).toBe('application/vnd.ms-fontobject');
    });
  });

  describe('text', () => {
    it('returns correct type for .txt files', () => {
      expect(getMimeType('readme.txt')).toBe('text/plain');
    });
  });

  describe('unknown extensions', () => {
    it('returns octet-stream for unknown extensions', () => {
      expect(getMimeType('file.xyz')).toBe('application/octet-stream');
    });

    it('returns octet-stream for files with no extension', () => {
      expect(getMimeType('Makefile')).toBe('application/octet-stream');
    });

    it('returns octet-stream for empty string', () => {
      expect(getMimeType('')).toBe('application/octet-stream');
    });
  });

  describe('path handling', () => {
    it('correctly extracts extension from a full path', () => {
      expect(getMimeType('_app/immutable/chunks/abc123.js')).toBe(
        'application/javascript',
      );
    });

    it('correctly handles files with multiple dots', () => {
      expect(getMimeType('chunk.abc123.js')).toBe('application/javascript');
    });

    it('correctly handles deeply nested paths', () => {
      expect(getMimeType('client/_app/immutable/entry/start.BxT4mGy.js')).toBe(
        'application/javascript',
      );
    });
  });
});
