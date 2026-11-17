# Raízes - Gerador de Árvore Genealógica

Aplicação interativa em React para montagem e visualização de árvores genealógicas através de linguagem natural e Inteligência Artificial.

## Recursos

- **Entrada em Linguagem Natural**: Basta descrever os membros e relações familiares (ex: "meu nome é daniel", "minha mae chama gisleine", "tenho um cachorro chamado thor") para que a IA (Groq SDK) monte a árvore.
- **Design Tokens M3**: Interface desenvolvida seguindo os tokens do Material Design 3 (cores, elevações e tipografia).
- **Avatares DiceBear Open Peeps**: Avatares gerados de acordo com o gênero e grau de parentesco.
- **Suporte a Pets**: Animais de estimação ganham identificador visual próprio com ícone de patinha.
- **Layout Otimizado**: Botão para reorganizar automaticamente os nós por geração e baricentro familiar.
- **Persistência**: Armazenamento automático no localStorage.

## Como Executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure sua chave da API Groq no arquivo `.env`:
   ```env
   VITE_GROQ_API_KEY=sua_chave_aqui
   ```

3. Inicie o servidor:
   ```bash
   npm run dev
   ```

## Tecnologias

- React 19 + Vite + TypeScript
- React Flow (@xyflow/react)
- Radix UI (@radix-ui/react-dialog)
- Groq SDK (openai/gpt-oss-120b)
- Lucide React
