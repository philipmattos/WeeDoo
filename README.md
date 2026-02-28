# WeeDoo

*[🇺🇸 Click here for English version](#english-version)*

O WeeDoo é um hub de produtividade moderno e modular, focado em organização pessoal "Local-First". Sua arquitetura técnica primária foi projetada para consolidar as ferramentas do cotidiano em uma única interface de alta performance, minimizando atrito, tempos de carregamento e o inchaço de dados.

## Principais Funcionalidades

O WeeDoo opera primariamente através de um sistema efêmero de navegação por modais que garante acesso instantâneo a:

- Tarefas: Gerenciamento rápido de tarefas diárias com sistema de prioridades.
- Kanban: Organização visual de projetos através de colunas customizáveis com interatividade Arrastar-e-Soltar.
- Notas: Editor de texto com suporte a Markdown ideal para rascunhos e anotações longas.
- Calendário: Rastreamento de eventos e prazos ligado intrinsecamente ao sistema de Tarefas.
- Compras: Gerenciador estendido de listas de supermercado com capacidade de compartilhamento e sincronização em múltiplos aparelhos.

## Arquitetura e Infraestrutura

A aplicação abandona os tradicionais modelos de autenticação via e-mail e senha, optando por uma metodologia estritamente *"Local-First"* combinada com uma infraestrutura opcional de Sincronização em Nuvem (Cloud Sync).

### Persistência Local-First
Por padrão, todos os dados do usuário (Tarefas, Quadros Kanban, Notas, Eventos do Calendário e Configurações) são agressivamente persistidos no cache via `localStorage` e orquestrados globalmente utilizando **Zustand**. Isto garante que o aplicativo opere em velocidades de resposta imediatas e permaneça integralmente funcional mesmo em ambientes offline ou locais sem sinal.

### Hidratação em Nuvem e Listas Compartilhadas (Netlify + Airtable)
Para os usuários que demandam disponibilidade entre múltiplos dispositivos (cross-device), o WeeDoo conta com um sistema lógico atômico chamado "*Savecode*". 
- Armazenamento Multi-Tabelas: O backend é composto por 5 bases isoladas do Airtable (`UsersData_Tasks`, `UsersData_Kanban`, `UsersData_Notes`, etc.), as quais persistem as configurações serializadas do Zustand individualmente. Isso previne o acúmulo de tráfego (data bloating), garantindo que marcar uma única tarefa como "Preenchida" não force o envio do backup do seu histórico gigantesco de notas textuais.
- Proxy Serverless via Netlify: O front-end jamais se comunica diretamente com o Airtable. Nenhuma chave do banco de dados reside localmente. Todas as transferências de dados da ferramenta são ofuscadas e roteadas de forma segura por meio das Funções Serverless do Netlify (`/api/airtable`).
- Web-Links de Listas de Compras: O módulo focado em compras de supermercado (Groceries) confia em um protocolo isolado de compartilhamento de IDs efêmeras. Uma lista compartilhada via código permite que número ilimitado de membros anônimos colaborem inserindo dados no seu carrinho simultaneamente, sem necessidade de Auth.

## A Stack de Tecnologias

A pilha tecnológica utilizada é embasada estritamente nos padrões pesados do ecossistema front-end:

- Framework: React + TypeScript
- Construção/Build: Vite
- Estilização: Tailwind CSS & Shadcn UI
- Gestão de Estado Global: Zustand (com Middleware de Persistência)
- Provedor Serveless Node Backend: Netlify Serverless Functions
- Banco de Dados Oficial: Airtable

## Documentação do Repositório

Para desenvolvedores que desejam inspecionar as regras operacionais da aplicação, as lógicas de arquitetura de projeto, ou caso desejem clonar o projeto na íntegra, favor consultar toda a suíte profunda de documentação residente na pasta `/Documents` deste repositório. 
Os guias de instalação avançada, como o `deploy_backend_setup.md` e o `airtable_setup.md`, mapeiam as exatas engrenagens e procedimentos exigidos para lhes ensinar e construir a sua própria rede blindada via Netlify Proxy.

---

<br>

<a name="english-version"></a>
# WeeDoo 

WeeDoo is a modern, modular productivity hub and local-first personal organization application. Its primary technical architecture is designed to consolidate everyday tools into a single, high-performance interface that minimizes friction, load times, and payload bloat.

## Core Features

WeeDoo operates primarily through an ephemeral modal navigation systems granting instant access to:

- Tasks: Quick daily task management with priority assignments.
- Kanban: Visual project organization across custom columns with Drag-and-Drop capability.
- Notes: Markdown-supported text editor for drafts and comprehensive annotations.
- Calendar: Event and deadline tracking intrinsically linked to the Task suite.
- Groceries: Shared shopping list manager capable of real-time synchronization.

## Architecture & Infrastructure

The application abandons traditional email/password authentication models in favor of a "Local-First" methodology combined with an optional Cloud Sync infrastructure.

### Local-First Persistence
By default, all user data (Tasks, Kanban boards, Notes, Calendar events, and Settings) is aggressively cached via localStorage and orchestrated globally using Zustand. This ensures that the application operates at native-like speeds and remains fully functional even in offline environments.

### Cloud Hydration & Shared Groceries (Netlify + Airtable)
For users who require cross-device availability, WeeDoo implements an atomic "Savecode" system. 
- Multi-Table Storage: A backend composed of 5 isolated Airtable bases (`UsersData_Tasks`, `UsersData_Kanban`, `UsersData_Notes`, etc.) persists the serialized Zustand configurations. This prevents data bloating by ensuring that modifying a single checkbox in the task list does not force a re-upload of a user's entire markdown notes history.
- Netlify Serverless Proxy: The frontend never directly communicates with Airtable. All payload transfers and Airtable API keys are obfuscated and routed securely through Netlify Serverless Functions (`/api/airtable`).
- Groceries Web-Links: The Groceries module relies on an ephemeral ID sharing protocol. When a list is marked for sharing, its ID is sent to the cloud, allowing an unlimited number of anonymous users to retrieve and update the list without requiring an account.

## Tech Stack

The stack is strictly focused on modern front-end ecosystem standards:

- Framework: React + TypeScript
- Build Tooling: Vite
- Styling: Tailwind CSS & Shadcn UI
- Global State Management: Zustand (with Persistence Middleware)
- Backend Provider: Netlify Serverless Functions
- Database: Airtable

## Repository Documentation

For developers looking to inspect the application rules, implementation logic, or clone the project for personal use, please refer to the internal documentation suite located in the `/Documents` directory. 
Important setup files such as `deploy_backend_setup.md` and `airtable_setup.md` outline the required procedures for building your own Netlify proxy.
