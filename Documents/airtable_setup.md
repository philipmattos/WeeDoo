# WeeDoo - Configuração do Banco de Dados (Airtable)

O WeeDoo agora funciona de forma "Local-First" na sua totalidade, dispensando logins/contas e mantendo tudo no dispositivo. A única exceção é a funcionalidade de "Compartilhar Listas" nas **Compras**, que requer um backend para armazenar os hashes remotos que dois ou mais usuários utilizarão para sincronizar uma lista. 

Para esse backend minimalista, escolhemos o **Airtable**, cuja configuração e instalação são diretas.

---

## 1. Criando a Base no Airtable
O Airtable funciona através de Planilhas (Bases).

1. Entre no [Airtable](https://airtable.com) e crie uma conta gratuita.
2. Inicie a criação de uma nova "Base" do zero. 
3. O nome padrão do sistema para a tabela dessa base deve ser renomeado para: **`GroceriesLists`**.
4. Configure as colunas (Campos) exatas exigidas pela aplicação. Você deve criar estritamente os três campos a seguir:
   - **`Title`** - (Tipo: 'Single line text') - Armazenará o título da lista de compras.
   - **`ItemsData`** - (Tipo: 'Long text') - Campo em formato String usado pelo app para persistir o JSON inteiro com a matriz de checkboxes (Id, Checked, etc).
5. Exclua quaisquer outros campos gerados pelo Airtable por padrão (como campo de Attachments, Status, etc). Deixe apenas as colunas: "Title", "ItemsData" e "Notes/Created" (automáticos se quiser).

---

## 2. Obtendo as Chaves de Conexão
Para o aplicativo se comunicar com a Base recém estruturada, você precisa extrair duas chaves secretas:

1. **`VITE_AIRTABLE_BASE_ID`**: 
   - Ao acessar sua Base principal aberta no Airtable, repare na URL no topo do navegador. Exemplo: `https://airtable.com/appXXXXXXXXXXXX/tblXXXXXXXXX/...`
   -  O código que intercala entre `com/` e a `/tbl` no exemplo (`appXXXXXXXXXXXX`) é a sua chave.
   - Alternativamente acesse: `https://airtable.com/create/tokens` para localizar na aba "API docs".

2. **`VITE_AIRTABLE_API_KEY`**: 
   - No painel da sua conta acesse a tela do desenvolvedor `https://airtable.com/create/tokens`.
   - Clique em "Create new token". Dê a ele as permissões (Scopes) de **"data.records:read"** e **"data.records:write"**. Na aba de acessos, conceda a ele o acesso à Base que você desenhou acima (`GroceriesLists` Base).
   - Gere o acesso e copie sua API_KEY (`patXXXXXXXXXXXX.xxxx...`).

---

## 3. Deployment pelo Netlify
O **GitHub** do desenvolvedor **nunca deverá expor essas chaves**. Você deve salvá-las estritamente como Variáveis de Ambiente dentro do painel do **Netlify**, não nos arquivos locais.

- Acesse a interface web principal de Gerenciamento do **Netlify**.
- Selecione o projeto `WeeDoo`.
- No menu lateral acesse: **"Site configuration"** -> **"Environment variables"**.
- Clique para adicionar novas variáveis. Insira o par de chaves obtidas no Airtable exatamente nos moldes suportados:
  - Adicione a Key: `VITE_AIRTABLE_BASE_ID` -> Value: `seu_appX...`
  - Adicione a Key: `VITE_AIRTABLE_API_KEY` -> Value: `patX...`
- Feito isso, execute a submissão. Certifique-se de acionar um Rededeploy no Netlify ("Trigger deploy") para que ele pegue as novas injeções na etapa de compilação/Build. 

Após a conclusão do processo, as Listas de Compras do site oficial finalmente conseguirão postar os IDs únicos na nuvem, e sua tabela do Airtable passará a atuar como distribuidor instantâneo.
