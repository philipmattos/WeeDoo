// src/services/airtable.ts

const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const TABLE_NAME = 'GroceriesLists';

if (!BASE_ID || !API_KEY) {
    console.warn("⚠️ Airtable credentials not found in environment variables.");
}

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
};

export interface AirtableRecord {
    id: string;
    fields: {
        Title?: string;
        ItemsData?: string;
    };
    createdTime: string;
}

// ─── Fetch List by ID (Importar) ──────────────────────────────────────────
export async function fetchListRecord(recordId: string): Promise<AirtableRecord | null> {
    try {
        const response = await fetch(`${API_URL}/${recordId}`, { headers });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Airtable error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Airtable record:", error);
        throw error;
    }
}

// ─── Create New List (Salvar Novo) ────────────────────────────────────────
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

        const response = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Airtable error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.records[0];
    } catch (error) {
        console.error("Error creating Airtable record:", error);
        throw error;
    }
}

// ─── Update Existing List (Sincronizar) ───────────────────────────────────
export async function updateListRecord(recordId: string, title: string, itemsDataJSON: string): Promise<AirtableRecord> {
    try {
        const payload = {
            fields: {
                Title: title,
                ItemsData: itemsDataJSON,
            }
        };

        const response = await fetch(`${API_URL}/${recordId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Airtable error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating Airtable record:", error);
        throw error;
    }
}

// ─── USER DATA WRAPPERS (Multi-Table Autosave) ─────────────────────────

export type UserDataTableName = 'UsersData_Tasks' | 'UsersData_Kanban' | 'UsersData_Notes' | 'UsersData_Calendar' | 'UsersData_Config';

export interface UserDataRecord {
    id: string;
    fields: {
        CodeID: string;
        Data: string;
    }
}

/**
 * Puxa os dados (Download) salvos na tabela em nuvem referentes ao Savecode.
 */
export async function fetchUserDataRecord(tableName: UserDataTableName, codeId: string): Promise<UserDataRecord | null> {
    try {
        // Encontra a exata linha do usuário filtrando.
        const filterFormula = `CodeID = '${codeId}'`;
        const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Airtable error fetching ${tableName}: ${response.statusText}`);

        const data = await response.json();
        if (data.records && data.records.length > 0) {
            return data.records[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user data from ${tableName}:`, error);
        return null; // Não causa crash. Apenas falha o download da nuvem de modo silencioso.
    }
}

/**
 * Comportamento de Upsert (Insere novo registro, ou faz PATCH no existente) daquele app isolado.
 */
export async function syncUserDataToAirtable(tableName: UserDataTableName, codeId: string, jsonData: string): Promise<void> {
    try {
        const existingRecord = await fetchUserDataRecord(tableName, codeId);
        const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${tableName}`;

        if (existingRecord) {
            // PATCH (Atualiza a linha contendo o JSON)
            const payload = {
                fields: {
                    Data: jsonData,
                }
            };
            const response = await fetch(`${baseUrl}/${existingRecord.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Failed to update ${tableName}`);
        } else {
            // POST (Cria do zero se o usuário for novo na tabela)
            const payload = {
                records: [{
                    fields: {
                        CodeID: codeId,
                        Data: jsonData,
                    }
                }]
            };
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Failed to insert into ${tableName}`);
        }
    } catch (error) {
        console.error(`Error autosyncing user data to ${tableName}:`, error);
        // Ocultado/fail-safe para não travar interfaces em caso de falta de internet.
    }
}
