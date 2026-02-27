# WeeDoo - Regras de Negócio

Este documento detalha as regras de negócio centrais e condições operacionais do aplicativo WeeDoo, assegurando consistência nas funcionalidades e proteção aos dados.

## 1. Modos de Uso e Armazenamento
O aplicativo foi concebido com duas identidades de uso distintas:
- **Modo Anônimo (Offline First):** O usuário pode acessar e utilizar o aplicativo perfeitamente sem criar uma conta. Todas as informações das aplicações (Tarefas, Notas, Compras, etc.) são salvas diretamente no Cache/LocalStorage do navegador do usuário.
- **Modo Autenticado:** Utiliza credenciais cadastradas e validadas no Supabase. Os dados passam a ser armazenados na nuvem, permitindo sincronização em múltiplos dispositivos. O cadastro de novos usuários é feito apenas em um portal distinto (não na aplicação principal).

## 2. Isolamento e Segurança de Dados (Login)
**Regra Estrita de Transição de Estado:** 
- Quando um usuário passa do Modo Anônimo para o Modo Autenticado (fazendo Login), **todos** os dados que estavam localmente no modo anônimo são **completamente descartados**.
- *Justificativa:* Isso evita falhas de segurança cruciais e bloqueia a possibilidade de usuários injetarem scripts maliciosos ou payloads viciados do cache local direto no banco de dados na nuvem.

## 3. Funcionalidade de Compartilhamento
O WeeDoo oferece colaboração em tempo real (ex: listas de compras ou de tarefas). A regra para colaboração é estrita:
- **Exclusividade:** Somente usuários logados (Modo Autenticado) podem enviar ou receber convites de compartilhamento. O Modo Anônimo não possui acesso a essa infraestrutura.
- **Mecânica de Aceite:** Quando um usuário convida o outro para uma lista (ex: lista do supermercado), quem foi convidado recebe uma **notificação na interface por meio de Modais Push**. Com o aceite, a lista de compras passa a poder ser lida e editada simultaneamente por todos os inscritos.
- **Propriedade e Edição:** As pessoas com acesso àquela lista poderão edita-la ou excluí-la mediante as permissões padrão atribuídas no momento do compartilhamento.

## 4. UI e Experiência do Usuário
- **Arquitetura de Navegação:** Todas as ferramentas e microaplicações do sistema (Notas, Tarefas, etc) abrem exclusivamente dentro de janelas flutuantes organizadas - os **Modais**, que são controlados por um gerenciador central. 
- **Mobile First e Estilo Visual:** Todos os botões clicáveis da interface obrigatoriamente seguem o formato **"Pill" (100% arredondados/rounded-3xl)**. A tela foi dimensionada otimizando sempre a experiência em Dispositivos Móveis.

## 5. Infraestrutura e Hospedagem
- O Deploy em ambiente de produção contínuo é realizado pelo **Netlify**.
