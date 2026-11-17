import type { FamilyMember, FamilyRelation } from '../types';
import type { Node, Edge } from '@xyflow/react';
import { isPetMember } from '../utils/petDetector';

export function inferGeneration(relation: string, isPet?: boolean): number {
  if (isPet || isPetMember(relation)) return 1;
  const rel = (relation || '').toLowerCase();
  if (/bisav[oó]/i.test(rel)) return -3;
  if (/av[oó]|vov[oó]/i.test(rel)) return -2;
  if (/pai|m[aã]e|tio|tia|sogr[oa]/i.test(rel)) return -1;
  if (/filh[oa]|sobrinh[oa]|genro|nora/i.test(rel)) return 1;
  if (/net[oa]/i.test(rel)) return 2;
  if (/bisnet[oa]/i.test(rel)) return 3;
  // default to 0 (Eu, Irmão, Irmã, Esposo(a), etc.)
  return 0;
}

interface FamilyUnit {
  type: 'single' | 'couple';
  members: FamilyMember[];
  idealX?: number;
  width: number;
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 120;
const HORIZONTAL_GAP = 70;
const COUPLE_GAP = 36;
const VERTICAL_GAP = 140;
const CANVAS_CENTER_X = 600;
const BASE_Y = 100;

/**
 * Algoritmo otimizado de layout genealógico:
 * 1. Agrupa por geração e detecta cônjuges (casais lado a lado).
 * 2. Posiciona filhos centralizados sob os pais / tutores.
 * 3. Centraliza pais sobre os filhos (barycenter).
 * 4. Resolve colisões horizontais mantendo espaçamentos M3.
 * 5. Alinha o centro da árvore no canvas.
 */
export function computeOptimalPositions(
  members: FamilyMember[],
  relations: FamilyRelation[]
): Record<string, { x: number; y: number; gen: number }> {
  if (members.length === 0) return {};

  // 1. Determina as gerações e ajusta com base nas relações
  const genMap = new Map<string, number>();
  members.forEach((m) => {
    const isPet = isPetMember(m.relation, m.isPet);
    const gen = m.generation !== undefined ? m.generation : inferGeneration(m.relation, isPet);
    genMap.set(m.id, gen);
  });

  // Refinamento de geração por arestas de parentesco
  relations.forEach((rel) => {
    const sourceGen = genMap.get(rel.source);
    const targetGen = genMap.get(rel.target);
    const isSpouse = /casad[oa]|c[oô]njuge|espos[oa]|marido/i.test(rel.relation);
    const isPetRel = isPetMember(rel.relation);

    if (sourceGen !== undefined && targetGen !== undefined) {
      if (isSpouse) {
        // Cônjuges ficam na mesma geração
        const minG = Math.min(sourceGen, targetGen);
        genMap.set(rel.source, minG);
        genMap.set(rel.target, minG);
      } else if (!isPetRel && sourceGen >= targetGen) {
        // Pais devem estar estritamente acima dos filhos
        genMap.set(rel.target, sourceGen + 1);
      }
    }
  });

  // 2. Mapeamento de cônjuges
  const spousePairs = new Map<string, string>();
  relations.forEach((rel) => {
    const isSpouse = /casad[oa]|c[oô]njuge|espos[oa]|marido/i.test(rel.relation);
    if (isSpouse) {
      spousePairs.set(rel.source, rel.target);
      spousePairs.set(rel.target, rel.source);
    }
  });

  // Mapeamento de pais -> filhos e filhos -> pais
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();

  relations.forEach((rel) => {
    const isSpouse = /casad[oa]|c[oô]njuge|espos[oa]|marido/i.test(rel.relation);
    if (!isSpouse) {
      // source é pai/tutor, target é filho/pet
      const currentChildren = childrenOf.get(rel.source) || [];
      currentChildren.push(rel.target);
      childrenOf.set(rel.source, currentChildren);

      const currentParents = parentsOf.get(rel.target) || [];
      currentParents.push(rel.source);
      parentsOf.set(rel.target, currentParents);
    }
  });

  // 3. Agrupa membros por geração
  const generationGroups = new Map<number, FamilyMember[]>();
  members.forEach((m) => {
    const gen = genMap.get(m.id) ?? 0;
    const group = generationGroups.get(gen) || [];
    group.push(m);
    generationGroups.set(gen, group);
  });

  const sortedGens = Array.from(generationGroups.keys()).sort((a, b) => a - b);
  const minGen = sortedGens.length > 0 ? Math.min(...sortedGens, 0) : 0;

  // 4. Cria unidades familiares (indivíduos ou casais) por geração
  const generationUnits = new Map<number, FamilyUnit[]>();

  sortedGens.forEach((gen) => {
    const group = generationGroups.get(gen) || [];
    const visited = new Set<string>();
    const units: FamilyUnit[] = [];

    group.forEach((m) => {
      if (visited.has(m.id)) return;

      const spouseId = spousePairs.get(m.id);
      const spouse = spouseId ? group.find((s) => s.id === spouseId) : undefined;

      if (spouse && !visited.has(spouse.id)) {
        visited.add(m.id);
        visited.add(spouse.id);
        units.push({
          type: 'couple',
          members: [m, spouse],
          width: CARD_WIDTH * 2 + COUPLE_GAP,
        });
      } else {
        visited.add(m.id);
        units.push({
          type: 'single',
          members: [m],
          width: CARD_WIDTH,
        });
      }
    });

    generationUnits.set(gen, units);
  });

  // 5. Calcula as posições X com relaxamento de baricentro
  const finalPositions: Record<string, { x: number; y: number; gen: number }> = {};

  // Posições X provisórias de cada membro para guiar as conexões
  const tempXMap = new Map<string, number>();

  sortedGens.forEach((gen) => {
    const units = generationUnits.get(gen) || [];
    const y = BASE_Y + (gen - minGen) * (CARD_HEIGHT + VERTICAL_GAP);

    // Atribui idealX para cada unidade com base nos pais
    units.forEach((unit) => {
      const parentXs: number[] = [];
      unit.members.forEach((member) => {
        const parents = parentsOf.get(member.id) || [];
        parents.forEach((pId) => {
          const px = tempXMap.get(pId);
          if (px !== undefined) parentXs.push(px);
        });
      });

      if (parentXs.length > 0) {
        const avgParentX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
        unit.idealX = avgParentX - unit.width / 2;
      }
    });

    // Ordena unidades por idealX (minimiza cruzamento de arestas)
    units.sort((a, b) => {
      if (a.idealX !== undefined && b.idealX !== undefined) return a.idealX - b.idealX;
      return 0;
    });

    // Resolve colisões da esquerda para a direita
    let currentLeft = CANVAS_CENTER_X - (units.reduce((acc, u) => acc + u.width, 0) + (units.length - 1) * HORIZONTAL_GAP) / 2;

    units.forEach((unit) => {
      let targetX = unit.idealX !== undefined ? unit.idealX : currentLeft;
      if (targetX < currentLeft) {
        targetX = currentLeft;
      }

      // Aplica posições aos membros da unidade
      if (unit.type === 'couple' && unit.members.length === 2) {
        const m1 = unit.members[0];
        const m2 = unit.members[1];
        const x1 = targetX;
        const x2 = targetX + CARD_WIDTH + COUPLE_GAP;

        finalPositions[m1.id] = { x: x1, y, gen };
        finalPositions[m2.id] = { x: x2, y, gen };
        tempXMap.set(m1.id, x1 + CARD_WIDTH / 2);
        tempXMap.set(m2.id, x2 + CARD_WIDTH / 2);

        currentLeft = x2 + CARD_WIDTH + HORIZONTAL_GAP;
      } else {
        const m = unit.members[0];
        finalPositions[m.id] = { x: targetX, y, gen };
        tempXMap.set(m.id, targetX + CARD_WIDTH / 2);

        currentLeft = targetX + CARD_WIDTH + HORIZONTAL_GAP;
      }
    });
  });

  // 6. Centralização global da árvore
  const allX = Object.values(finalPositions).map((p) => p.x);
  if (allX.length > 0) {
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX) + CARD_WIDTH;
    const treeCenter = (minX + maxX) / 2;
    const offsetX = CANVAS_CENTER_X - treeCenter;

    Object.keys(finalPositions).forEach((id) => {
      finalPositions[id].x = Math.round(finalPositions[id].x + offsetX);
    });
  }

  return finalPositions;
}

export function computeTreeLayout(
  members: FamilyMember[],
  relations: FamilyRelation[]
): { nodes: Node[]; edges: Edge[] } {
  const positions = computeOptimalPositions(members, relations);

  const nodes: Node[] = members.map((member) => {
    const pos = positions[member.id] || { x: 500, y: 100, gen: 0 };
    return {
      id: member.id,
      type: 'familyCard',
      position: { x: pos.x, y: pos.y },
      data: {
        id: member.id,
        name: member.name,
        relation: member.relation,
        gender: member.gender,
        generation: pos.gen,
        notes: member.notes,
        isPet: isPetMember(member.relation, member.isPet),
      },
    };
  });

  const edges: Edge[] = relations.map((rel, index) => {
    const isSpouse = /casad[oa]|c[oô]njuge|espos[oa]|marido/i.test(rel.relation);
    const isPetRel = isPetMember(rel.relation);

    return {
      id: rel.id || `edge-${rel.source}-${rel.target}-${index}`,
      source: rel.source,
      target: rel.target,
      sourceHandle: isSpouse ? 'right' : 'bottom',
      targetHandle: isSpouse ? 'left' : 'top',
      type: isSpouse ? 'straight' : 'smoothstep',
      animated: true,
      label: rel.relation,
      style: {
        stroke: isSpouse
          ? 'var(--md-sys-color-secondary)'
          : isPetRel
          ? 'var(--md-sys-color-tertiary)'
          : 'var(--md-sys-color-primary)',
        strokeWidth: 2.5,
        strokeDasharray: isSpouse ? '4 4' : undefined,
      },
      labelStyle: {
        fill: 'var(--md-sys-color-on-surface)',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'var(--md-sys-typescale-font)',
      },
      labelBgStyle: {
        fill: 'var(--md-sys-color-surface-container-high)',
        fillOpacity: 0.9,
        rx: 6,
        ry: 6,
      },
      labelBgPadding: [6, 3] as [number, number],
    };
  });

  return { nodes, edges };
}

/**
 * Reorganiza nós existentes preservando dados e calculando as posições ótimas.
 */
export function reorganizeNodes<T extends Node>(
  existingNodes: T[],
  relations: FamilyRelation[]
): T[] {
  const members: FamilyMember[] = existingNodes.map((node) => {
    const data = node.data as Record<string, unknown>;
    return {
      id: node.id,
      name: String(data.name || node.id),
      relation: String(data.relation || 'Familiar'),
      gender: data.gender as FamilyMember['gender'],
      generation: typeof data.generation === 'number' ? data.generation : undefined,
      notes: typeof data.notes === 'string' ? data.notes : undefined,
      isPet: Boolean(data.isPet),
    };
  });

  const optimalPositions = computeOptimalPositions(members, relations);

  return existingNodes.map((node) => {
    const newPos = optimalPositions[node.id];
    if (!newPos) return node;

    return {
      ...node,
      position: {
        x: newPos.x,
        y: newPos.y,
      },
    };
  });
}
