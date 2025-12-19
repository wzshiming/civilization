import type { CultureID, OrganizationID, OrganizationTypeID } from './ids.js';
import type { Organization, OrganizationRelationship } from './organization.js';

/**
 * Culture relationship with another culture
 */
export interface CultureRelationship {
  targetCulture: CultureID;
  favorability: number; // -1.0 to 1.0
  affinity: number; // 0.0 to 1.0
}

/**
 * Culture definition - a specialized organization type
 */
export interface Culture {
  cultureID: CultureID;
  name: string;
  description: string;
  relationships: CultureRelationship[];
}

/**
 * Helper function to convert Culture to Organization
 */
export function cultureToOrganization(culture: Culture, organizationType: OrganizationTypeID = 'culture'): Organization {
  return {
    organizationID: culture.cultureID as OrganizationID,
    organizationType,
    name: culture.name,
    description: culture.description,
    relationships: culture.relationships.map(rel => ({
      targetOrganization: rel.targetCulture as OrganizationID,
      favorability: rel.favorability,
      attributes: {
        affinity: rel.affinity,
      },
    })),
  };
}

/**
 * Helper function to convert Organization to Culture
 */
export function organizationToCulture(organization: Organization): Culture {
  return {
    cultureID: organization.organizationID as CultureID,
    name: organization.name,
    description: organization.description,
    relationships: organization.relationships.map(rel => ({
      targetCulture: rel.targetOrganization as CultureID,
      favorability: rel.favorability,
      affinity: rel.attributes.affinity ?? 0,
    })),
  };
}
