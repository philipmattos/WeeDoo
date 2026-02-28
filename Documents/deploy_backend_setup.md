# Guia de Deploy e Segurança do Banco de Dados (Airtable + Netlify)

O **WeeDoo** foi projetado para ser "Local-First", gravando os dados primariamente no cache do navegador (LocalStorage). No entanto, para o sistema de múltiplas contas (Savecodes) operar com segurança e sincronizar os dados na nuvem, usamos o **Airtable** como banco de dados.

⚠️ **ATENÇÃO À SEGURANÇA:** O código *frontend* de uma aplicação React/Vite é público. Qualquer pessoa pode inspecionar o código do site (`F12`). Colocar a sua **API Key do Airtable** diretamente em variáveis de ambiente como `VITE_AIRTABLE_API_KEY` permite que invasores a roubem e apaguem o seu banco de dados.

Para arquiteturas reais, configuraremos uma **Serverless Function no Netlify** (Um micro-servidor invisível) que age como ponte (Proxy). Ele guardará a sua chave a 7 chaves no servidor. 

Siga este passo a passo se quiser clonar ou replicar o ecossistema SaaS de Banco do WeeDoo.

---

## Passo 1: O Backend Invisible (Netlify Functions)
Você não precisa alugar servidores ou escrever em PHP/Python. Vamos usar a própria infraestrutura do Netlify que já hospeda o site.

1. **Instale o pacote do Netlify no terminal** na raiz do projeto:
```bash
npm install -D @netlify/functions
```

2. **Crie o Arquivo do Roteador**:
Na raiz do WeeDoo, crie uma pasta chamada `netlify`, e dentro dela outra chamada `functions`.
Crie o arquivo: `netlify/functions/airtable.ts`

Insira o código do Guardião (Proxy) lá dentro. Ele irá interceptar e mascarar a sua chave:

```typescript
import { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    // Vedar acesso a métodos indevidos
    if (req.method !== "POST" && req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // Pega as chaves diretamente e de forma segura do cofre do Netlify:
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_API_KEY;

    if (!BASE_ID || !API_KEY) {
        return new Response(JSON.stringify({ error: "Server missing Airtable envs" }), { status: 500 });
    }

    try {
        const body = await req.json();
        const { tableName, action, payload, filterByFormula } = body;

        let airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${tableName}`;
        let fetchOptions: RequestInit = {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
        };

        if (action === "GET_RECORD") {
            airtableUrl += `?filterByFormula=${encodeURIComponent(filterByFormula)}&maxRecords=1`;
            fetchOptions.method = "GET";
        } else if (action === "SYNC_RECORD") {
            fetchOptions.method = "POST";
            fetchOptions.body = JSON.stringify(payload);
        }

        // Backend faz a requisição mascarada e blindada ao Banco
        const response = await fetch(airtableUrl, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify(data), { status: response.status });
        }

        return new Response(JSON.stringify(data), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Server malfunction." }), { status: 500 });
    }
};

// Formato Serverless v2 Core do Roteador
export const config: Config = {
    path: "/api/airtable",
};
```

---

## Passo 2: Reformar a conexão Frontend (React)
Após criar a ponte segura, seu código Front-end não precisa mais saber da existência de chaves. O arquivo `.env.local` pode ser deletado. 

Você alterará os arquivos de serviço (ex: `src/services/airtable.ts`) para se comunicarem diretamente com a API do Netlify que você gerou, como demonstrado:

```typescript
const INTERNAL_API_URL = "/api/airtable";

// Ao invés de usar Headers e Headers Bearer Tokens, você só passa os dados.
export async function syncUserDataToAirtable(tableName: string, codeId: string, jsonData: string): Promise<void> {
    const response = await fetch(INTERNAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tableName,
            action: "SYNC_RECORD",
            payload: // [DADOS POST]
        })
    });
}
```

---

## Passo 3: Cadastrar Segredos na Nuvem (Painel Netlify)
Seu Backend agora assumiu as rédeas da segurança, mas ele precisa das chaves de Banco originais em produção para poder funcionar.

1. Acesse o **painel principal** do Netlify onde o WeeDoo está mapeado.
2. Navegue para: *Site configuration* > *Environment variables*.
3. Clique em **Add a variable** > **Insert a single variable**.
4. Crie Exatamente as duas variáveis abaixo com as informações do seu Airtable:
   - Key: `AIRTABLE_BASE_ID` | Value: `seu_id_do_banco (app...)`
   - Key: `AIRTABLE_API_KEY` | Value: `sua_chave_de_acesso (pat...)`
   *(Nota: O prefixo `VITE_` foi banido de propósito. O Vite não empacotará mais essas chaves no Browser do cliente).*
6. Clique em Salvar e reinicie o deploy do site pelo Github.

Os saves de conta estarão rodando de forma 100% blindada e invisível com infraestrutura limpa, Serverless, sem a exposição da API Key nas Redes.
