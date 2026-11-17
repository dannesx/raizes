import type { Gender } from '../types';

// Common Brazilian and Portuguese names
const KNOWN_FEMALE_NAMES = new Set([
  'gisleine', 'gisleide', 'gisele', 'maria', 'ana', 'beatriz', 'juliana',
  'camila', 'larissa', 'leticia', 'letícia', 'fernanda', 'mariana', 'amanda',
  'patricia', 'patrícia', 'carolina', 'luiza', 'luísa', 'gabriela', 'clara',
  'helena', 'sophia', 'sofia', 'alice', 'valentina', 'laura', 'isabela',
  'isabella', 'manuela', 'manoela', 'julia', 'júlia', 'aline', 'vanessa',
  'renata', 'bruna', 'carla', 'daniela', 'paula', 'debora', 'débora', 'marta',
  'rosa', 'lucia', 'lúcia', 'teresa', 'tereza', 'fatima', 'fátima', 'tatiana',
  'bianca', 'jessica', 'jéssica', 'natalia', 'natália', 'raquel', 'sara',
  'sarah', 'eliana', 'eliane', 'regina', 'viviane', 'monica', 'mônica',
  'marcia', 'márcia', 'adriana', 'priscila', 'claudia', 'cláudia', 'silvia',
  'sílvia', 'simone', 'cristina', 'lorena', 'heloisa', 'heloísa', 'melissa',
  'marina', 'elisa', 'cecilia', 'cecília', 'livia', 'lívia', 'yasmin',
  'isadora', 'rebeca', 'joana', 'flavia', 'flávia', 'suzana', 'suzane'
]);

const KNOWN_MALE_NAMES = new Set([
  'daniel', 'danilo', 'carlos', 'roberto', 'joão', 'joao', 'pedro', 'lucas',
  'matheus', 'mateus', 'felipe', 'filipe', 'gustavo', 'guilherme', 'leonardo',
  'gabriel', 'rafael', 'bruno', 'rodrigo', 'thiago', 'tiago', 'andre', 'andré',
  'marcos', 'luciano', 'eduardo', 'fernando', 'diego', 'arthur', 'artur',
  'bernardo', 'davi', 'david', 'miguel', 'heitor', 'theo', 'théo', 'enzo',
  'samuel', 'victor', 'vitor', 'marcelo', 'alexandre', 'caio', 'vinicius',
  'vinícius', 'ricardo', 'antonio', 'antônio', 'jose', 'josé', 'francisco',
  'paulo', 'sergio', 'sérgio', 'marcio', 'márcio', 'renato', 'fabio', 'fábio',
  'cesar', 'césar', 'leandro', 'julio', 'júlio', 'hugo', 'igor', 'otavio',
  'otávio', 'breno', 'raul', 'murilo', 'cauã', 'cauan', 'luiz', 'luis', 'luís'
]);

/**
 * Preve o gênero com base no gênero explícito, grau de parentesco e nome.
 */
export function predictGender(
  name: string,
  relation?: string,
  explicitGender?: Gender
): Gender {
  // 1. Se gênero explícito foi informado e válido (diferente de 'other')
  if (explicitGender === 'male' || explicitGender === 'female') {
    return explicitGender;
  }

  const rel = (relation || '').trim().toLowerCase();

  // 2. Previsão pelo grau de parentesco
  if (
    /m[aã]e|irm[aã]|filha|esposa|mulher|av[oó]|vov[oó]|tia|prima|sogra|cunhada|sobrinha|neta|bisav[oó]|madrinha|madrasta|namorada|noiva/i.test(
      rel
    )
  ) {
    // Atenção com avô vs avó
    if (rel === 'avô' || rel === 'vovô' || rel === 'bisavô') {
      return 'male';
    }
    return 'female';
  }

  if (
    /pai|irm[aã]o|filho|esposo|marido|homem|av[oó]|vov[oó]|tio|primo|sogro|cunhado|sobrinho|neto|bisav[oó]|padrinho|padrasto|namorado|noivo/i.test(
      rel
    )
  ) {
    // Atenção com avó vs avô
    if (rel === 'avó' || rel === 'vovó' || rel === 'bisavó') {
      return 'female';
    }
    return 'male';
  }

  // 3. Previsão pelo Primeiro Nome
  const firstName = (name || '')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos para busca rápida

  if (KNOWN_FEMALE_NAMES.has(firstName)) {
    return 'female';
  }
  if (KNOWN_MALE_NAMES.has(firstName)) {
    return 'male';
  }

  // 4. Heurística de sufixo de nomes em português
  if (firstName.endsWith('a') && !['luca', 'luka', 'jean', 'elba', 'alexa'].includes(firstName)) {
    return 'female';
  }

  if (
    firstName.endsWith('o') ||
    firstName.endsWith('os') ||
    firstName.endsWith('or') ||
    firstName.endsWith('el') ||
    firstName.endsWith('er')
  ) {
    return 'male';
  }

  return 'other';
}
