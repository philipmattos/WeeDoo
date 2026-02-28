# WeeDoo - Configuração do Banco de Dados (Airtable)

O WeeDoo agora funciona primariamente de forma "Local-First", mas suporta backups integrais na nuvem sincronizados pelo seu "Savecode". Toda a base de dados (Tarefas, Kanban, Notas, Calendário e Configurações) é gravada na nuvem.
Também inclui a funcionalidade de "Compartilhar Listas" nas **Compras**, que requer esse backend para armazenar os hashes remotos.

Para o banco de dados oficial dessa estrutura, escolhemos o **Airtable**, cuja configuração e instalação são escaláveis usando sua Arquitetura Multi-Tabelas.

---

## 1. Criando a Base no Airtable
O Airtable funciona através de Planilhas (Bases).

1. Entre no [Airtable](https://airtable.com) e crie uma conta gratuita.
2. Inicie a criação de uma nova "Base" do zero. 
3. Você deve arquitetar **5 novas tabelas** exatamente com os seguintes nomes:
   - `UsersData_Tasks`
   - `UsersData_Kanban`
   - `UsersData_Notes`
   - `UsersData_Calendar`
   - `UsersData_Config`
   *(A tabela original de compartilhamento do Supermercado `GroceriesLists` também é essencial).*

4. **Para as 5 Tabelas do usuário**, configure estritamente as colunas exatas:
   - **`CodeID`** - (Tipo: 'Single line text') - Armazenará a ID Mestre do usuário (`weedoo-xxxx`). Este deve ser o **Primary Field**.
   - **`Data`** - (Tipo: 'Long text') - Campo que persistirá o JSON pesado gerado pelo estado (Zustand) do usuário.
5. Exclua quaisquer outros campos gerados pelo Airtable por padrão nessas tabelas (como Attachments, Status). Deixe apenas as colunas vitais e uma de "Last Modified" se quiser segurança extra.

---

## 2. Obtendo as Chaves de Conexão
Para o aplicativo se comunicar com a Base recém estruturada, você precisa extrair duas chaves secretas:

1. **`AIRTABLE_BASE_ID`**: 
   - Ao acessar sua Base principal aberta no Airtable, repare na URL no topo do navegador. Exemplo: `https://airtable.com/appXXXXXXXXXXXX/tblXXXXXXXXX/...`
   -  O código que intercala entre `com/` e a `/tbl` no exemplo (`appXXXXXXXXXXXX`) é a sua chave.
   - Alternativamente acesse: `https://airtable.com/create/tokens` para localizar na aba "API docs".

2. **`AIRTABLE_API_KEY`**: 
   - No painel da sua conta acesse a tela do desenvolvedor `https://airtable.com/create/tokens`.
   - Clique em "Create new token". Dê a ele as permissões (Scopes) de **"data.records:read"** e **"data.records:write"**. Na aba de acessos, conceda a ele o acesso à Base que você desenhou acima.
   - Gere o acesso e copie sua API_KEY (`patXXXXXXXXXXXX.xxxx...`).

---

## 3. Segurança do Deployment (Netlify Functions)
**ATENÇÃO:** O aplicativo utiliza um Proxy Backend via Funções Serverless do Netlify (`netlify/functions/airtable.ts`). **O GitHub do desenvolvedor e o front-end público nunca devem expor chaves VITE_AIRTABLE_**. A extração ocorre isolada no servidor em nuvem.

- Acesse a interface web principal de Gerenciamento do **Netlify**.
- Selecione o projeto `WeeDoo`.
- No menu lateral acesse: **"Site configuration"** -> **"Environment variables"**.
- Clique para adicionar novas variáveis:
  - Key: `AIRTABLE_BASE_ID` -> Value: `seu_appX...`
  - Key: `AIRTABLE_API_KEY` -> Value: `patX...`
*(Nota: não use o prefixo `VITE_` nestas envs. O frontend não precisa puxar chaves graças à arquitetura Proxy feita na fase 2).*

- Feito isso, execute a submissão. Certifique-se de acionar um Rededeploy no Netlify ("Trigger deploy").

Após o deploy do Netlify consolidar a Serverless Function, seu login de `Savecode` interligará o Airtable como Distribuidor Oficial das 5 tabelas atômicas e com 100% de blindagem.
