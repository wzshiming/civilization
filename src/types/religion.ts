import type { ReligionID, OrganizationID, OrganizationTypeID } from './ids.js';
import type { Organization, OrganizationRelationship } from './organization.js';

/**
 * Religion relationship with another religion
 */
export interface ReligionRelationship {
  targetReligion: ReligionID;
  favorability: number; // -1.0 (hostile) to 1.0 (friendly)
  tolerance: number; // 0.0 to 1.0
}

/**
 * Religion definition - a specialized organization type
 */
export interface Religion {
  religionID: ReligionID;
  name: string;
  description: string;
  relationships: ReligionRelationship[];
}

/**
 * Helper function to convert Religion to Organization
 */
export function religionToOrganization(religion: Religion, organizationType: OrganizationTypeID = 'religion'): Organization {
  return {
    organizationID: religion.religionID as OrganizationID,
    organizationType,
    name: religion.name,
    description: religion.description,
    relationships: religion.relationships.map(rel => ({
      targetOrganization: rel.targetReligion as OrganizationID,
      favorability: rel.favorability,
      attributes: {
        tolerance: rel.tolerance,
      },
    })),
  };
}

/**
 * Helper function to convert Organization to Religion
 */
export function organizationToReligion(organization: Organization): Religion {
  return {
    religionID: organization.organizationID as ReligionID,
    name: organization.name,
    description: organization.description,
    relationships: organization.relationships.map(rel => ({
      targetReligion: rel.targetOrganization as ReligionID,
      favorability: rel.favorability,
      tolerance: rel.attributes.tolerance ?? 0,
    })),
  };
}
