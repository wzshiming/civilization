import { describe, it, expect } from 'vitest';
import { mapToSVG, mapToHTML } from '../viewer/map-viewer.js';
import { generateMap } from '../generators/map-generator.js';

describe('MapViewer', () => {
  const testMap = generateMap({
    plotCount: 50,
    randomSeed: 42,
    relaxationSteps: 1
  });

  describe('mapToSVG', () => {
    it('should generate valid SVG', () => {
      const svg = mapToSVG(testMap);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should include polygons for each plot', () => {
      const svg = mapToSVG(testMap);
      const polygonCount = (svg.match(/<polygon/g) || []).length;
      
      // Should have polygons (some plots may have < 3 vertices and be skipped)
      expect(polygonCount).toBeGreaterThan(0);
    });

    it('should respect showBorders option', () => {
      const svgWithBorders = mapToSVG(testMap, { showBorders: true });
      const svgWithoutBorders = mapToSVG(testMap, { showBorders: false });
      
      expect(svgWithBorders).toContain('stroke="#333"');
      expect(svgWithoutBorders).not.toContain('stroke="#333"');
    });

    it('should respect showCenters option', () => {
      const svgWithCenters = mapToSVG(testMap, { showCenters: true });
      const svgWithoutCenters = mapToSVG(testMap, { showCenters: false });
      
      expect(svgWithCenters).toContain('<circle');
      expect(svgWithoutCenters).not.toContain('<circle');
    });

    it('should use custom background color', () => {
      const svg = mapToSVG(testMap, { backgroundColor: '#ff0000' });
      
      expect(svg).toContain('fill="#ff0000"');
    });
  });

  describe('mapToHTML', () => {
    it('should generate valid HTML', () => {
      const html = mapToHTML(testMap);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include the SVG map', () => {
      const html = mapToHTML(testMap);
      
      expect(html).toContain('<svg');
      expect(html).toContain('</svg>');
    });

    it('should include legend', () => {
      const html = mapToHTML(testMap);
      
      expect(html).toContain('Legend');
      expect(html).toContain('Ocean');
      expect(html).toContain('Plains');
    });

    it('should include statistics', () => {
      const html = mapToHTML(testMap);
      
      expect(html).toContain('Map Statistics');
      expect(html).toContain('Total');
    });

    it('should include page title', () => {
      const html = mapToHTML(testMap);
      
      expect(html).toContain('Civilization Map Viewer');
    });
  });
});
