import API_URL from "./api";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    created_at?: string;
}

export interface ChatResponse {
    reply: string;
    changed: boolean;
    pending: boolean;
    actions: string[];
    provider: string;
}

function authHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

async function readJson(response: Response) {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
        throw new Error(
            "A API respondeu em um formato inesperado. Verifique se o backend desta versão está rodando na porta 3000."
        );
    }

    return response.json();
}

export async function getChatHistory(): Promise<ChatMessage[]> {
    const response = await fetch(
        `${API_URL}/api/chat/history`,
        {
            method: "GET",
            headers: authHeaders()
        }
    );

    const result = await readJson(response);

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao carregar a conversa."
        );
    }

    return result;
}

export async function sendChatMessage(
    message: string
): Promise<ChatResponse> {
    const response = await fetch(
        `${API_URL}/api/chat`,
        {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ message })
        }
    );

    const result = await readJson(response);

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao enviar mensagem."
        );
    }

    return result;
}

export async function clearChatHistory(): Promise<void> {
    const response = await fetch(
        `${API_URL}/api/chat/history`,
        {
            method: "DELETE",
            headers: authHeaders()
        }
    );

    if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        const result = contentType.includes("application/json")
            ? await response.json().catch(() => ({}))
            : {};

        throw new Error(
            result.error || "Erro ao apagar a conversa."
        );
    }
}

export async function resolveChatPending(decision: "confirm" | "cancel"): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/api/chat/pending/${decision}`, {
        method: "POST",
        headers: authHeaders()
    });
    const result = await readJson(response);
    if (!response.ok) throw new Error(result.error || "Erro ao confirmar a alteração.");
    return result;
}
