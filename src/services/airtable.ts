// src/services/airtable.ts

export type UserDataTableName = 'UsersData_Tasks' | 'UsersData_Kanban' | 'UsersData_Notes' | 'UsersData_Calendar' | 'UsersData_Config';

export interface UserDataRecord {
    id: string;
    fields: {
        CodeID: string;
        Data: string;
    }
}

// O Frontend agora bate APENAS na sua própria API nativa protegida (Função Serverless)
// Importante: Localmente isso pode dar 404 se não usar o `netlify dev`, 
// mas em produção (deploy) rodará perfeito. 
// Para dev local testando o backend: rode `npx netlify dev` ao invés de `npm run dev`
const INTERNAL_API_URL = "/api/airtable";

/**
 * Puxa os dados (Download) salvos na tabela em nuvem referentes ao Savecode.
 */
export async function fetchUserDataRecord(tableName: UserDataTableName, codeId: string): Promise<UserDataRecord | null> {
    try {
        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName,
                action: "GET_RECORD",
                filterByFormula: `CodeID = '${codeId}'`
            })
        });

        if (!response.ok) throw new Error("Backend query failed");

        const data = await response.json();
        if (data.records && data.records.length > 0) {
            return data.records[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user data from ${tableName}:`, error);
        return null;
    }
}

/**
 * Comportamento de Upsert via proxy (Insere ou Atualiza)
 */
export async function syncUserDataToAirtable(tableName: UserDataTableName, codeId: string, jsonData: string): Promise<void> {
    try {
        // Verifica primeiro se o registro já existe para atualizar (PATCH simulado) ou criar (POST simulado) via Backend
        const existingRecord = await fetchUserDataRecord(tableName, codeId);

        let payload;
        if (existingRecord) {
            payload = {
                records: [{
                    id: existingRecord.id,
                    fields: { CodeID: codeId, Data: jsonData }
                }]
            };
        } else {
            payload = {
                records: [{
                    fields: { CodeID: codeId, Data: jsonData }
                }]
            };
        }

        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName,
                action: "SYNC_RECORD",
                payload
            })
        });

        if (!response.ok) throw new Error("Backend sync execution failed");

    } catch (error) {
        console.error(`Failed to sync to ${tableName}:`, error);
        throw error;
    }
}
