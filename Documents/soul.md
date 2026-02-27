# WeeDoo - Regras de Ouro (Soul)

*Este documento define o comportamento padrão, padronizações e regras estritas que devem ser seguidas durante todo o desenvolvimento do aplicativo.*

## 1. Arquitetura e Stack
- **Framework:** React com TypeScript, construído usando o bundler **Vite**.
- **Estilização:** **Tailwind CSS** integrado com **Shadcn UI** para construção do design system e padronização visual.
- **Backend/DB (Fase 2):** **Supabase** (Auth, Database, Realtime). Todo o banco será modelado do zero em um segundo momento.
- **Abordagem Mobile-First:** A UI deve ser primariamente pensada para dispositivos móveis, com visual e sensação próximos de aplicativos nativos. Utilizaremos modais/drawers/bottom sheets para facilitar a visualização de abas e formulários.

## 2. Regras de Negócio e Modos de Uso
O aplicativo terá um foco inicial no modo offline completo, sem obrigação de cadastro na tela inicial.
- **Offline/Anonymous First:** O modo anônimo deve ser totalmente funcional, armazenando tudo no cache ou localStorage do navegador do usuário.
- **Segurança e Isolamento de Dados:** Para evitar injeções de script no banco de dados nas nuvens, os dados anônimos **serão descartados** permanentemente quando o usuário fizer login. Não haverá migração ou sincronização retroativa.
- **Privilégios de Autenticação:** A funcionalidade de compartilhamento em tempo real (Notificações Push, listas e projetos colaborativos) é **exclusiva para usuários logados**. Anônimos não podem gerar nem aceitar links de compartilhamento.

## 3. Padrões de Código
Abaixo constam as convenções estritas que guiarão o desenvolvimento (são as diretrizes de "Clean Code" e "Arquitetura" para o Assistente):
- **Tipagem Estrita (TypeScript):** Evitar o uso de `any`. Toda prop de componente e modelo de dado local/remoto deve possuir uma `interface` ou `type` explicitamente definido.
- **Componentização:** Priorizar *Functional Components* (usando *Arrow Functions*). Componentes devem ser modulares e ter uma única responsabilidade.
- **Gerenciamento de Estado:** Para estado efêmero e de UI (modais abertos, inputs) usa-se o estado local do React (`useState`). Para estado global da aplicação (tarefas globais, notas, flags de autenticação) usaremos **Zustand** ou a **Context API**.
- **Nomenclatura:** 
  - Variáveis e funções utilitárias: `camelCase`.
  - Componentes React e Interfaces/Tipos: `PascalCase`.
  - Pastas: `kebab-case` ou `camelCase` dependendo do nível, com preferência por `kebab-case` para rotas.

## 4. Estrutura de Pastas (Baseada em Features)
A raiz principal do código será `src/`, organizada para fácil escalabilidade:
- `assets/` - Imagens estáticas e ícones locais.
- `components/` - Componentes compartilhados da UI. Separados em subpastas:
  - `components/ui/` - Componentes atômicos do Shadcn (botões, inputs, dialogs).
- `features/` - Separação por domínio do aplicativo. Cada feature pode ter seus próprios componentes, hooks e tipos.
  - Ex: `features/tasks/`, `features/kanban/`, `features/notes/`, `features/calendar/`.
- `hooks/` - Hooks customizados que são utilizados em mais de uma feature.
- `lib/` - Configurações gerais e funções utilitárias (ex: `lib/utils.ts` do Tailwind, `lib/supabase.ts`).
- `store/` - Configuração da gerência de estado global.
- `types/` - Tipagens TypeScript que são usadas globalmente no projeto.
- `App.tsx` e `main.tsx` - Pontos de entrada.

## 5. Fluxo de Trabalho e Documentação Histórica
- Todo progresso diário principal precisa ser atualizado na pasta `Documents/HISTORY/` usando a data atual (ex: `2026-02-27.md`).
- A lista mestre de tarefas a fazer deve ser mantida sincronizada nos arquivos `task.md` (Artefato do Sistema) e `Documents/tasks.md`.
- Nenhuma feature grande deve ser iniciada sem primeiro ser registrada ou atualizada neste documento de planejamento se necessário.
