import { Groq } from 'groq-sdk';
import type { FamilyMember, FamilyRelation, FamilyGraphData } from '../types';
import { storageService } from './storageService';
import { predictGender } from '../utils/genderPredictor';
import { isPetMember } from '../utils/petDetector';

const SYSTEM_PROMPT = `
Você é um assistente especialista em genealogia e árvores genealógicas, capaz de incluir membros humanos e animais de estimação (pets).
O usuário vai fornecer frases em linguagem natural sobre ele, seus familiares e pets (ex: "meu nome é daniel", "minha mae chama gisleine", "tenho um cachorro chamado thor", "meu gato mingau").

Sua tarefa é analisar a frase fornecida no contexto dos membros e relações já existentes na árvore genealógica, e retornar a lista COMPLETA E ATUALIZADA de membros (nodes) e relações (edges) no formato JSON.

REGRAS:
1. Preserve os membros já existentes na árvore, atualizando ou adicionando os novos membros identificados no texto.
2. Cada membro deve ter:
   - "id": string única em minúsculas sem acentos ou caracteres especiais (ex: "daniel", "gisleine", "thor_pet")
   - "name": Nome próprio capitalizado (ex: "Daniel", "Gisleine", "Thor", "Mingau")
   - "relation": O parentesco do membro (ex: "Eu", "Mãe", "Pai", "Irmão", "Filho", "Pet", "Cachorro", "Gato", etc.)
   - "gender": "male" | "female" | "other" (identifique pelo nome/termo: cachorro/gato -> male, cachorrinha/gata -> female)
   - "isPet": boolean (true caso seja um animal de estimação como cachorro, gato, pássaro, etc., ou false para humanos)
   - "generation": número inteiro:
       - -3: bisavós
       - -2: avós
       - -1: pais, tios, sogros
       -  0: a pessoa principal ("Eu"), irmãos, cônjuges, primos
       -  1: filhos, sobrinhos, pets (animais de estimação da família)
       -  2: netos
3. Cada relação em "updatedRelations" deve conter:
   - "source": id do ancestral/tutor
   - "target": id do descendente/pet
   - "relation": rótulo legível (ex: "Mãe de", "Pai de", "Filho de", "Casado com", "Pet de", "Tutor de")
   - "type": "parent-child" | "spouse" | "sibling" | "pet"
   * IMPORTANTE: 'source' deve ser o tutor/humano e 'target' deve ser o pet quando houver animais de estimação.
4. Se o usuário disser "tenho um cachorro chamado thor", thor deve ter "isPet": true, "relation": "Cachorro", "gender": "male", "generation": 1, e relação source: "daniel", target: "thor", relation: "Pet de".
5. Responda ESTRITAMENTE em formato JSON (sem explicações adicionais fora do JSON):
{
  "updatedMembers": [ ... ],
  "updatedRelations": [ ... ],
  "summary": "Breve frase descrevendo o que foi adicionado"
}
`;

function extractJson(rawText: string) {
  // 1. Tenta parse direto
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // continua
  }

  // 2. Extrai de bloco markdown ```json ... ```
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // continua
    }
  }

  // 3. Extrai buscando o primeiro '{' e último '}'
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = rawText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continua
    }
  }

  throw new Error(`Não foi possível extrair um JSON válido da resposta do modelo:\n${rawText.slice(0, 300)}...`);
}

export async function processFamilyContext(
  userInput: string,
  existingMembers: FamilyMember[],
  existingRelations: FamilyRelation[],
  overrideApiKey?: string
): Promise<{
  graph: FamilyGraphData;
  summary: string;
}> {
  const apiKey =
    overrideApiKey ||
    import.meta.env.VITE_GROQ_API_KEY ||
    storageService.getCustomApiKey();

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_groq_api_key_here')) {
    throw new Error(
      'Chave da API Groq não encontrada! Por favor, adicione sua VITE_GROQ_API_KEY no arquivo .env ou informe-a no campo correspondente.'
    );
  }

  const groq = new Groq({
    apiKey: apiKey.trim(),
    dangerouslyAllowBrowser: true,
  });

  const userContextMessage = `
Estado atual da árvore genealógica:
- Membros existentes: ${JSON.stringify(existingMembers, null, 2)}
- Relações existentes: ${JSON.stringify(existingRelations, null, 2)}

Nova frase informada pelo usuário:
"${userInput.trim()}"

Atualize e retorne o JSON com todos os membros e suas conexões.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContextMessage },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      reasoning_effort: 'medium',
      stop: null,
    });

    let fullContent = '';
    for await (const chunk of chatCompletion) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    if (!fullContent) {
      throw new Error('A API Groq retornou uma resposta vazia.');
    }

    const parsed = extractJson(fullContent);
    const rawMembers: FamilyMember[] = parsed.updatedMembers || [];
    const updatedMembers: FamilyMember[] = rawMembers.map((m) => {
      const isPet = isPetMember(m.relation, m.isPet);
      return {
        ...m,
        isPet,
        gender: predictGender(m.name, m.relation, m.gender),
      };
    });
    const updatedRelations: FamilyRelation[] = parsed.updatedRelations || [];
    const summary: string = parsed.summary || 'Árvore genealógica atualizada com sucesso.';

    return {
      graph: {
        nodes: updatedMembers,
        edges: updatedRelations,
      },
      summary,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Erro ao conectar com Groq API: ${errMsg}`);
  }
}
