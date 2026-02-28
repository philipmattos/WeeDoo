# WeeDoo - Regras de Negócio

Este documento detalha as regras de negócio centrais e condições operacionais do aplicativo WeeDoo.

## 1. Modo Estritamente Local (Local-First)
- **Acesso Aberto e Sem Login:** O aplicativo é completamente aberto e não possui sistema de contas, senhas ou autenticação (Login). Todo o uso do aplicativo é anônimo.
- **Armazenamento:** Todas as informações do usuário (Tarefas, Notas, Projetos Kanban, Calendário, etc.) são salvas direta e exclusivamente no Cache/LocalStorage do navegador do usuário apontando para a sua máquina.

## 2. Compartilhamento via Nuvem (Savecode e Compras)
O aplicativo realiza comunicação blindada com a Nuvem (Airtable) através de um backend Proxy Serverless no Netlify para gerenciar Dados Globais e Funcionalidades Rápidas.
- **Sincronização de Progresso (Savecode):** O usuário pode opcionalmente gerar um "Savecode". Com essa ID em mãos, suas listas, notas e configurações são backupeadas integralmente em 5 tabelas no Airtable toda vez que ele clica em "Sincronizar". 
- **Listas de Compras:** Continua permitindo compartilhamento assíncrono entre múltiplos usuários. O app gera um registro na nuvem, e quem insere aquele código específico enxerga a mesma compra de mantimentos em tempo real, sem necessidade de logins/senhas.
- **Segurança da Instância Pública:** Como o projeto (e o repositório GitHub) é público, as chaves e dados do banco de dados não ficam expostas no código. Elas são injetadas através de Variáveis de Ambiente diretamente no servidor de hospedagem (Netlify Functions) que as isola perfeitamente através de Proxy.

## 3. UI e Experiência do Usuário
- **Arquitetura de Navegação:** Todas as ferramentas e microaplicações do sistema (Notas, Tarefas, etc) abrem exclusivamente dentro de janelas flutuantes organizadas - os **Modais**, que são controlados por um gerenciador central na base do app. 
- **Mobile First e Estilo Visual:** Todos os botões clicáveis da interface obrigatoriamente seguem o formato de cantos totalmente arredondados (excesso em botões/toggles) e modais estilo "app nativo", com interações e bottom menus de rápido alcance. A tela foi dimensionada otimizando sempre a experiência em Dispositivos Móveis de forma responsiva (`max-w-md mx-auto` para visual mobile em ambiente desktop).

## 4. Infraestrutura e Hospedagem
- O Deploy contínuo/produção é realizado e publicado na infraestrutura do **Netlify**.
- O backend de suporte temporário e leitura de listas remotas está alocado na plataforma **Airtable**.
