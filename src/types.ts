export type Gender = 'male' | 'female' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // e.g., 'Eu', 'Mãe', 'Pai', 'Irmão', 'Filho', 'Pet', 'Cachorro', 'Gato', etc.
  gender?: Gender;
  generation?: number; // 0 for root/user, -1 for parents, -2 for grandparents, 1 for children/pets
  notes?: string;
  isPet?: boolean;
}

export interface FamilyRelation {
  id?: string;
  source: string; // parent or relation id
  target: string; // child or related person id
  relation: string; // e.g., 'Mãe de', 'Pai de', 'Casado com', 'Pet de', 'Tutor de'
  type?: 'parent-child' | 'spouse' | 'sibling' | 'pet';
}

export interface FamilyGraphData {
  nodes: FamilyMember[];
  edges: FamilyRelation[];
}

export interface PersonNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  relation: string;
  gender?: Gender;
  generation?: number;
  notes?: string;
  isPet?: boolean;
  onDelete?: (id: string) => void;
}
