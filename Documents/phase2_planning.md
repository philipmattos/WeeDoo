# WeeDoo - Planejamento Fase 2 (Sistema Savecode)

## 📌 Resumo do Objetivo
Mudar o comportamento de "Estado Anônimo Imutável" para um sistema global de persistência onde cada usuário possui uma **ID Mestre** alfanumérica (o `Savecode`). Esta ID servirá tanto para identificar o usuário quanto como chave para recuperar seus dados do Airtable (Cloud Save), num modelo estilo video game clássico. Não haverá coleta de dados (e-mails, senhas ou oauth).

---

## 🏗️ 1. Alterações no Banco de Dados (Airtable)
Para otimizar o Autofill (Autosave) contínuo e resolver preocupações com limites de tamanho por célula, adotaremos uma **Arquitetura Multi-Tabelas**. Cada microaplicativo terá sua própria tabela isolada, conversando através do `CodeID` do usuário. Isso divide a carga e permite sincronizações granulares (ex: mudar apenas uma tarefa não força o re-upload das notas inteiras).

As **5 Novas Tabelas** criadas no Airtable serão:
1. `UsersData_Tasks`
2. `UsersData_Kanban`
3. `UsersData_Notes`
4. `UsersData_Calendar`
5. `UsersData_Config` (Para salvar modo escuro, e IDs de Listas de Compras atreladas)

Todas as 5 tabelas compartilharão exatamente a mesma estrutura de colunas:
- `CodeID` (Single line text): A ID Mestre do usuário (Ex: `weedoo-xxx`). **(Primary Field)**
- `Data` (Long text): O JSON específico *apenas* daquele microaplicativo. Limite confortável de 100.000 caracteres por app.
- `LastSync` (Last modified time): Atualizado por segurança automática.

### A Estratégia Anti-Bloat (Trancamento de Dados)
Sua intuição sobre a divisão de tabelas foi **precisa**. Ela é a base da nossa estratégia Anti-Bloat definitiva:
* **Autosave Granular:** Se o usuário marcar uma tarefa como concluída, o app fará upload *apenas* para a tabela `UsersData_Tasks`. As anotações gigantescas na `UsersData_Notes` não gastarão internet nem processamento atoa.
* **Escalabilidade:** Cada aplicativo ganha seu próprio teto isolado de 100.000 caracteres. Para um usuário comum, é praticamente impossível estourar isso focando apenas em textos no Kanban ou Tasks, sem travar o sistema.
* **Redução de Payload:** O carregamento inicial (Download) fará 5 pequenas requisições rápidas em paralelo (`Promise.all`), montando o estado na velocidade da luz e guardando tudo no cache local.

---

## 🛠️ 2. Arquitetura do Estado (Autosync Automático)
O App operará de forma **Automática e Transparente**, como o "Autosave" dos consoles modernos.

**A nova loja principal (`authStore`):**
- Gerencia o estado atual do aplicativo. Variáveis: `isLoggedIn` (bool), `saveCode` (string | null).
- Ações: `generateSaveCode()`, `loginWithCode(code)`, `logout()`.

**O Fluxo do Sincronizador Backend (`CloudSyncService`):**
- **Autosave Silencioso (Push):** Através do `subscribe` do Zustand, o sistema "escuta" quando um store muda (ex: NoteStore mudou). Ele aguarda um *Debounce* (ex: 3 a 5 segundos sem digitar nada) e dispara o `PATCH/POST` silencioso via internet apenas para a tabela referente àquele store.
- **Pull (Download Inicial):** Acontece _somente_ quando o usuário faz "Login via Código" pela primeira vez. O sistema desce os dados das tabelas, sobreescreve o LocalStorage e avança para a tela inicial.

---

## 📱 3. Modificações na UI (Telas e Componentes)

### A. Nova Rota/Capa "Welcome & Auth"
Como não haverá mais uma entrada direta sem rosto caso o usuário queira ter o seu código, a tela `<App />` interceptará o usuário (caso ele não possua o `saveCode` ativo nas storages locais) exibindo uma landing de "Start Game":
1. **Botão "Criar Novo Backup (Iniciar)":** Gera uma hash única. Exibe em formato grande, junto a um botão brilhante de *Copiar para WhatsApp/Clipboard*. Exige que o usuário dê um check "Eu guardei este código".
2. **Botão "Já tenho um Código (Continuar)":** Abre uma caixa de texto simples. Colou, validou o tamanho da string, ele bate no Airtable `fetch(CodeID)`, se achar os registros, preenche os Stores e avança para o Dashboard.
3. *Opção Oculta "Continuar Offline":* Podemos (ou não) manter para o cara que ainda recusa tudo e só quer usar o app no celular até formatar a máquina.

### B. Header / Profile Area no Dashboard
Em vez de focar só nas notificações ou um rosto de usuário fake:
- O painel superior precisa exibir o `CodeID` discreto (ex: _Seu código do sistema: weedoo-xxx_) e botões "Sincronizar Progresso" e "Sair (Logout)".

---

## ⚖️ 4. Regras e Desafios (Conflitos)
- **Conflito Local vs Nuvem:** Como o sistema é offline-first, e se ele mexer offline e desincronizar? 
  *Solução simples:* O backup de progresso sempre sobrescreve o Airtable no modo Push (Last Write Wins). E numa formatação, o Login sempre sobrescreve o celular (Pull total).
- **Lista de Compras (Shared List):** O sistema isolado da GroceriesModal que fizemos na Fase 1 (onde duas pessoas usam uma mesma lista) entra em uma pequena incongruência. O estado do Supermercado continuará no Airtable separado (Tabela `GroceriesLists`) porque ela pertence a N pessoas. O Dump/Backup do "Savecode" guardará os links das listas daquele usuário, mas as compras ainda moram na tabela delas sozinhas. 

---

## 🚀 Próximas Decisões (Para Aprovação)

1. Concorda com essa divisão de Tabela (`Saves`) carregando um Mega-JSON e funcionando independente do carrinho?
2. A sincronização em nuvem do Save fará Push e salvará silenciosamente no background (a cada X minutos ou a cada grande alteração) **OU** o usuário deverá bater em um botão tipo Disquete `[Salvar Progresso]` manualmente, como num video-game clássico?
