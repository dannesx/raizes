export function isPetMember(relation?: string, isPetExplicit?: boolean): boolean {
  if (isPetExplicit === true) return true;
  if (!relation) return false;

  const rel = relation.toLowerCase().trim();
  return (
    rel.includes('pet') ||
    rel.includes('cachorr') ||
    rel.includes('gat') ||
    rel.includes('cão') ||
    rel.includes('cao') ||
    rel.includes('filhote') ||
    rel.includes('bichinho') ||
    rel.includes('hamster') ||
    rel.includes('coelho') ||
    rel.includes('pássaro') ||
    rel.includes('passarinho') ||
    rel.includes('animal')
  );
}
