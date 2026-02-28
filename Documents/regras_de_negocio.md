# WeeDoo - Regras de Negócio

Este documento detalha as regras de negócio centrais e condições operacionais do aplicativo WeeDoo.

## 1. Modo Estritamente Local (Local-First)
- **Acesso Aberto e Sem Login:** O aplicativo é completamente aberto e não possui sistema de contas, senhas ou autenticação (Login). Todo o uso do aplicativo é anônimo.
- **Armazenamento:** Todas as informações do usuário (Tarefas, Notas, Projetos Kanban, Calendário, etc.) são salvas direta e exclusivamente no Cache/LocalStorage do navegador do usuário apontando para a sua máquina.

## 2. Compartilhamento via Nuvem (Listas de Compras)
O único momento em que a aplicação se comunica com um Banco de Dados na nuvem (Airtable) é para uso da funcionalidade de compartilhamento de **Listas de Compras**.
- **Segurança da Instância Pública:** Como o projeto (e o repositório GitHub) é público, as chaves e dados do banco de dados não ficam expostas no código. Elas são injetadas através de Variáveis de Ambiente diretamente no servidor de hospedagem, (Netlify, Vercel ou outros).
- **Mecânica de Sincronização:** Quando o usuário clica em "Salvar e Compartilhar" em uma Lista de Compras, o App cria um registro anônimo no Airtable. Isso gera um "Código de Conexão" (ID na nuvem).
- **Acesso por Código:** Qualquer pessoa que inserir esse ID de nuvem no seu próprio aparelho sincronizará aquela lista específica. Ambos passarão a ver e atualizar a lista simultaneamente. O armazenamento de outras partes do sistema permanece estritamente local.

## 3. UI e Experiência do Usuário
- **Arquitetura de Navegação:** Todas as ferramentas e microaplicações do sistema (Notas, Tarefas, etc) abrem exclusivamente dentro de janelas flutuantes organizadas - os **Modais**, que são controlados por um gerenciador central na base do app. 
- **Mobile First e Estilo Visual:** Todos os botões clicáveis da interface obrigatoriamente seguem o formato de cantos totalmente arredondados (excesso em botões/toggles) e modais estilo "app nativo", com interações e bottom menus de rápido alcance. A tela foi dimensionada otimizando sempre a experiência em Dispositivos Móveis de forma responsiva (`max-w-md mx-auto` para visual mobile em ambiente desktop).

## 4. Infraestrutura e Hospedagem
- O Deploy contínuo/produção é realizado e publicado na infraestrutura do **Netlify**.
- O backend de suporte temporário e leitura de listas remotas está alocado na plataforma **Airtable**.
