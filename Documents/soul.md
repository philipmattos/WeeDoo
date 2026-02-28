# WeeDoo - Regras de Ouro (Soul)

*Este documento define o comportamento padrão, padronizações e regras estritas que devem ser seguidas durante todo o desenvolvimento do aplicativo.*

## 1. Arquitetura e Stack
- **Framework:** React com TypeScript, construído usando o bundler **Vite**.
- **Estilização:** **Tailwind CSS** integrado com **Shadcn UI** para construção do design system e padronização visual.
- **Backend/DB:** Totalmente arquitetado em **Local-First** (armazenamento persistente do dispositivo), conectado de forma leve a instâncias do **Airtable** gerenciadas por variáveis de ambiente ocultas do Netlify para nuvem.
- **Abordagem Mobile-First:** A UI deve ser primariamente pensada para dispositivos móveis, com visual e sensação próximos de aplicativos nativos. Utilizaremos modais/janelas sobrepostas para facilitar a visualização de abas e formulários.

## 2. Regras de Negócio e Modos de Uso
O aplicativo possui foco único em navegação livre e off-line. 
- **Local-First & Anonymous:** Todo controle é mantido no cache/localStorage. O aplicativo não exige nem contém telas de registro (sem obrigação de contas/Auth). Totalmente focado em fricção zero.
- **Compartilhamento Efêmero:** O acesso entre múltiplos usuários é feito trocando/vinculando os "Web Links" / IDs. Não existe login para acessar e as listas de compras agem como salas compartilháveis autônomas através do backend do Airtable.

## 3. Padrões de Código
Abaixo constam as convenções estritas que guiarão o desenvolvimento (são as diretrizes de "Clean Code" e "Arquitetura"):
- **Tipagem Estrita (TypeScript):** Evitar o uso generalizado de `any`. Toda prop de componente e modelo de dado local/remoto deve possuir uma `interface` ou `type` explicitamente definido.
- **Componentização:** Priorizar *Functional Components* (usando *Arrow Functions*). Componentes devem ser modulares.
- **Gerenciamento de Estado:** Para estado efêmero e de UI usa-se o estado local do React (`useState`). Para estado persistente da aplicação (tarefas globais, notas, preferências, dados da lista) utilizamos o **Zustand** consumindo a local storage com suporte às suas APIs.
- **Nomenclatura:** 
  - Variáveis e funções: `camelCase`.
  - Componentes React, Types/Interfaces: `PascalCase`.
  - Pastas: Preferência por `camelCase` ou `kebab-case`.

## 4. Estrutura de Pastas
A raiz principal do código será `src/`, organizada para fácil escalabilidade:
- `assets/` - Imagens estáticas e ícones locais.
- `components/` - Componentes compartilhados da UI.
  - `components/ui/` - Componentes atômicos do Shadcn (botões, inputs, dialogs).
- `Modals/` ou `features/` - Separação estrutural de recursos (Janelas de Tarefas, Compras, Kanban).
- `services/` - Microserviços de rede/APIs externas como por exemplo: `airtable.ts`.
- `hooks/` - Hooks customizados que são utilizados em mais de uma rota.
- `lib/` - Configurações gerais e funções utilitárias (ex: `lib/utils.ts` do Tailwind).
- `store/` - Configuração da gerência de estado global construído via zustand.
- `types/` - Tipagens TypeScript que são usadas globalmente.

## 5. Fluxo de Trabalho e Documentação Histórica
- Todo progresso diário principal precisa ser atualizado na pasta `Documents/HISTORY/` usando a data da Sprint.
- Nenhum recurso (feature) complexo deve ser reescrito sem atualizar e re-analisar primeiro as regras documentadas nas atas destas documentações.
