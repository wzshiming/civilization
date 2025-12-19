import type { OrganizationID, OrganizationTypeID } from './ids.js';

/**
 * Organization type defining categories of organizations
 * (e.g., "religion", "culture", "clan", "nation", "alliance")
 */
export interface OrganizationType {
  organizationTypeID: OrganizationTypeID;
  name: string;
  description: string;
}

/**
 * Organization relationship with another organization
 */
export interface OrganizationRelationship {
  targetOrganization: OrganizationID;
  favorability: number; // -1.0 (hostile) to 1.0 (friendly)
  attributes: Record<string, number>; // Additional type-specific attributes
}

/**
 * Organization definition - base type for religions, cultures, clans, etc.
 */
export interface Organization {
  organizationID: OrganizationID;
  organizationType: OrganizationTypeID;
  name: string;
  description: string;
  relationships: OrganizationRelationship[];
}
