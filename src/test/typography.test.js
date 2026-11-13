import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Typography System: Manrope & Inter Configuration', () => {
  const indexHtmlPath = path.resolve(__dirname, '../../index.html');
  const indexCssPath = path.resolve(__dirname, '../index.css');

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf-8');

  describe('Google Fonts & Efficient Loading in index.html', () => {
    it('preconnects to fonts.googleapis.com and fonts.gstatic.com', () => {
      expect(indexHtml).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
      expect(indexHtml).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
    });

    it('imports Manrope and Inter fonts with display=swap', () => {
      expect(indexHtml).toMatch(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']*family=Inter/);
      expect(indexHtml).toMatch(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']*family=Manrope/);
      expect(indexHtml).toMatch(/display=swap/);
    });

    it('imports only necessary targeted font weights', () => {
      // Inter: 400, 500, 600, 700
      expect(indexHtml).toContain('family=Inter:wght@400;500;600;700');
      // Manrope: 500, 600, 700, 800
      expect(indexHtml).toContain('family=Manrope:wght@500;600;700;800');
    });

    it('has 16px base font size class on body element', () => {
      expect(indexHtml).toMatch(/<body[^>]*class="[^"]*text-base[^"]*"/);
    });
  });

  describe('Reusable Typography Tokens & Variables in src/index.css', () => {
    it('defines --font-display with Manrope stack in :root and @theme', () => {
      expect(indexCss).toMatch(/--font-display:\s*'Manrope'/);
      expect(indexCss).toMatch(/--font-display:\s*"Manrope"/);
    });

    it('defines --font-body and --font-sans with Inter stack in :root and @theme', () => {
      expect(indexCss).toMatch(/--font-body:\s*'Inter'/);
      expect(indexCss).toMatch(/--font-sans:\s*'Inter'/);
      expect(indexCss).toMatch(/--font-body:\s*"Inter"/);
      expect(indexCss).toMatch(/--font-sans:\s*"Inter"/);
    });

    it('defines 16px base font size token and fluid scale', () => {
      expect(indexCss).toContain('--font-size-base: 1rem'); // 16px
      expect(indexCss).toContain('font-size: 16px'); // html root
    });

    it('defines line height rhythms for comfortable readability', () => {
      expect(indexCss).toContain('--line-height-tight: 1.15');
      expect(indexCss).toContain('--line-height-normal: 1.5');
      expect(indexCss).toContain('--line-height-relaxed: 1.625');
    });

    it('maps headings and .font-display to var(--font-display)', () => {
      expect(indexCss).toMatch(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*\.font-display\s*\{[^}]*font-family:\s*var\(--font-display\)/);
    });

    it('maps body paragraphs and descriptions to var(--font-body, var(--font-sans))', () => {
      expect(indexCss).toMatch(/p,\s*li,\s*dl,\s*dd,\s*dt,\s*blockquote\s*\{[^}]*font-family:\s*var\(--font-body/);
    });

    it('maps forms, inputs, and buttons to var(--font-body, var(--font-sans))', () => {
      expect(indexCss).toMatch(/button,\s*input,\s*select,\s*textarea\s*\{[^}]*font-family:\s*var\(--font-body/);
    });
  });
});
