import type { SkillTypeID } from './ids.js';

/**
 * Skill type definition
 */
export interface SkillType {
  skillTypeID: SkillTypeID;
  name: string;
  description: string;
}

/**
 * Skill instance with experience level
 */
export interface Skill {
  skillTypeID: SkillTypeID;
  experience: number;
}
