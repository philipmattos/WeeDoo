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
export const INTERNAL_API_URL = "/api/airtable";

export interface AirtableRecord {
    id: string;
    fields: {
        Title?: string;
        ItemsData?: string;
    };
    createdTime: string;
}

// ─── Fetch List by ID (Importar Compras) ──────────────────────────────────
export async function fetchListRecord(recordId: string): Promise<AirtableRecord | null> {
    try {
        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName: 'GroceriesLists',
                action: 'GET_BY_ID',
                recordId
            })
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Airtable error`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Airtable record:", error);
        throw error;
    }
}

// ─── Create New List (Salvar Novo Compras) ────────────────────────────────
export async function createListRecord(title: string, itemsDataJSON: string): Promise<AirtableRecord> {
    try {
        const payload = {
            records: [
                {
                    fields: {
                        Title: title,
                        ItemsData: itemsDataJSON,
                    }
                }
            ]
        };

        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName: 'GroceriesLists',
                action: 'CREATE_RECORD',
                payload
            })
        });

        if (!response.ok) {
            throw new Error(`Airtable error`);
        }

        const data = await response.json();
        return data.records[0];
    } catch (error) {
        console.error("Error creating Airtable record:", error);
        throw error;
    }
}

// ─── Update Existing List (Atualizar Compras) ───────────────────────────
export async function updateListRecord(recordId: string, title: string, itemsDataJSON: string): Promise<AirtableRecord> {
    try {
        const payload = {
            fields: {
                Title: title,
                ItemsData: itemsDataJSON,
            }
        };

        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName: 'GroceriesLists',
                action: 'UPDATE_RECORD',
                recordId,
                payload
            })
        });

        if (!response.ok) {
            throw new Error(`Airtable update error`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating Airtable record:", error);
        throw error;
    }
}

/**
 * Puxa os dados (Download) salvos na tabela em nuvem referentes ao Savecode.
 */
export async function fetchUserDataRecord(tableName: UserDataTableName, codeId: string): Promise<UserDataRecord | null> {
    const response = await fetch(INTERNAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tableName,
            action: "GET_RECORD",
            filterByFormula: `{CodeID} = '${codeId}'`
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable Error on ${tableName}: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (data.records && data.records.length > 0) {
        return data.records[0];
    }
    return null;
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
