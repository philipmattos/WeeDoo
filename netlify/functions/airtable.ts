import { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    // Vedar acesso a métodos indevidos
    if (req.method !== "POST" && req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // Pega as chaves diretamente e de forma segura do cofre do Netlify 
    // ou do .env local
    const BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY;

    if (!BASE_ID || !API_KEY) {
        return new Response(JSON.stringify({ error: "Server missing Airtable env variables" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
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
        } else {
            return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400 });
        }

        // Backend faz a requisição mascarada e blindada ao Banco
        const response = await fetch(airtableUrl, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Netlify Function Error:", error);
        return new Response(JSON.stringify({ error: "Server malfunction." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};

// Formato Serverless v2 Core do Roteador
export const config: Config = {
    path: "/api/airtable",
};
