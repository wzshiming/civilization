import { describe, it, expect } from 'vitest';
import type { Religion, Culture, Organization } from '../types/index.js';
import { religionToOrganization, organizationToReligion } from '../types/religion.js';
import { cultureToOrganization, organizationToCulture } from '../types/culture.js';

describe('Organization System', () => {
  describe('Religion to Organization conversion', () => {
    it('should convert religion to organization', () => {
      const religion: Religion = {
        religionID: 'rel-1',
        name: 'Test Religion',
        description: 'A test religion',
        relationships: [
          {
            targetReligion: 'rel-2',
            favorability: 0.5,
            tolerance: 0.8,
          },
        ],
      };

      const organization = religionToOrganization(religion);

      expect(organization.organizationID).toBe('rel-1');
      expect(organization.organizationType).toBe('religion');
      expect(organization.name).toBe('Test Religion');
      expect(organization.description).toBe('A test religion');
      expect(organization.relationships).toHaveLength(1);
      expect(organization.relationships[0].targetOrganization).toBe('rel-2');
      expect(organization.relationships[0].favorability).toBe(0.5);
      expect(organization.relationships[0].attributes.tolerance).toBe(0.8);
    });

    it('should convert religion to organization with custom type', () => {
      const religion: Religion = {
        religionID: 'rel-1',
        name: 'Test Religion',
        description: 'A test religion',
        relationships: [],
      };

      const organization = religionToOrganization(religion, 'custom-religion-type');

      expect(organization.organizationType).toBe('custom-religion-type');
    });

    it('should handle empty relationships', () => {
      const religion: Religion = {
        religionID: 'rel-1',
        name: 'Test Religion',
        description: 'A test religion',
        relationships: [],
      };

      const organization = religionToOrganization(religion);

      expect(organization.relationships).toHaveLength(0);
    });
  });

  describe('Organization to Religion conversion', () => {
    it('should convert organization to religion', () => {
      const organization: Organization = {
        organizationID: 'org-1',
        organizationType: 'religion',
        name: 'Test Organization',
        description: 'A test organization',
        relationships: [
          {
            targetOrganization: 'org-2',
            favorability: 0.7,
            attributes: {
              tolerance: 0.9,
            },
          },
        ],
      };

      const religion = organizationToReligion(organization);

      expect(religion.religionID).toBe('org-1');
      expect(religion.name).toBe('Test Organization');
      expect(religion.description).toBe('A test organization');
      expect(religion.relationships).toHaveLength(1);
      expect(religion.relationships[0].targetReligion).toBe('org-2');
      expect(religion.relationships[0].favorability).toBe(0.7);
      expect(religion.relationships[0].tolerance).toBe(0.9);
    });

    it('should handle missing tolerance attribute', () => {
      const organization: Organization = {
        organizationID: 'org-1',
        organizationType: 'religion',
        name: 'Test Organization',
        description: 'A test organization',
        relationships: [
          {
            targetOrganization: 'org-2',
            favorability: 0.7,
            attributes: {},
          },
        ],
      };

      const religion = organizationToReligion(organization);

      expect(religion.relationships[0].tolerance).toBe(0);
    });
  });

  describe('Culture to Organization conversion', () => {
    it('should convert culture to organization', () => {
      const culture: Culture = {
        cultureID: 'cul-1',
        name: 'Test Culture',
        description: 'A test culture',
        relationships: [
          {
            targetCulture: 'cul-2',
            favorability: 0.6,
            affinity: 0.75,
          },
        ],
      };

      const organization = cultureToOrganization(culture);

      expect(organization.organizationID).toBe('cul-1');
      expect(organization.organizationType).toBe('culture');
      expect(organization.name).toBe('Test Culture');
      expect(organization.description).toBe('A test culture');
      expect(organization.relationships).toHaveLength(1);
      expect(organization.relationships[0].targetOrganization).toBe('cul-2');
      expect(organization.relationships[0].favorability).toBe(0.6);
      expect(organization.relationships[0].attributes.affinity).toBe(0.75);
    });

    it('should convert culture to organization with custom type', () => {
      const culture: Culture = {
        cultureID: 'cul-1',
        name: 'Test Culture',
        description: 'A test culture',
        relationships: [],
      };

      const organization = cultureToOrganization(culture, 'custom-culture-type');

      expect(organization.organizationType).toBe('custom-culture-type');
    });
  });

  describe('Organization to Culture conversion', () => {
    it('should convert organization to culture', () => {
      const organization: Organization = {
        organizationID: 'org-1',
        organizationType: 'culture',
        name: 'Test Organization',
        description: 'A test organization',
        relationships: [
          {
            targetOrganization: 'org-2',
            favorability: 0.4,
            attributes: {
              affinity: 0.85,
            },
          },
        ],
      };

      const culture = organizationToCulture(organization);

      expect(culture.cultureID).toBe('org-1');
      expect(culture.name).toBe('Test Organization');
      expect(culture.description).toBe('A test organization');
      expect(culture.relationships).toHaveLength(1);
      expect(culture.relationships[0].targetCulture).toBe('org-2');
      expect(culture.relationships[0].favorability).toBe(0.4);
      expect(culture.relationships[0].affinity).toBe(0.85);
    });

    it('should handle missing affinity attribute', () => {
      const organization: Organization = {
        organizationID: 'org-1',
        organizationType: 'culture',
        name: 'Test Organization',
        description: 'A test organization',
        relationships: [
          {
            targetOrganization: 'org-2',
            favorability: 0.4,
            attributes: {},
          },
        ],
      };

      const culture = organizationToCulture(organization);

      expect(culture.relationships[0].affinity).toBe(0);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain religion data through round-trip conversion', () => {
      const originalReligion: Religion = {
        religionID: 'rel-1',
        name: 'Test Religion',
        description: 'A test religion',
        relationships: [
          {
            targetReligion: 'rel-2',
            favorability: 0.5,
            tolerance: 0.8,
          },
        ],
      };

      const organization = religionToOrganization(originalReligion);
      const convertedReligion = organizationToReligion(organization);

      expect(convertedReligion).toEqual(originalReligion);
    });

    it('should maintain culture data through round-trip conversion', () => {
      const originalCulture: Culture = {
        cultureID: 'cul-1',
        name: 'Test Culture',
        description: 'A test culture',
        relationships: [
          {
            targetCulture: 'cul-2',
            favorability: 0.6,
            affinity: 0.75,
          },
        ],
      };

      const organization = cultureToOrganization(originalCulture);
      const convertedCulture = organizationToCulture(organization);

      expect(convertedCulture).toEqual(originalCulture);
    });
  });
});
