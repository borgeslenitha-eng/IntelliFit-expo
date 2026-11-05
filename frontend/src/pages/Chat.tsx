import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useRef,
    useState
} from "react";
import {
    clearChatHistory,
    getChatHistory,
    sendChatMessage,
    resolveChatPending,
    type ChatMessage,
    type ChatResponse
} from "../services/chatService";

const examples = [
    "O que tenho na geladeira?",
    "O que tenho na despensa?",
    "O que tenho no freezer?",
    "O que vence nos próximos 7 dias?",
    "O que posso cozinhar com o que tenho?"
];

function renderInline(text: string): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={`${part}-${index}`}>
                    {part.slice(2, -2)}
                </strong>
            );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
    });
}

function normalizeMessageLines(content: string): string[] {
    const rawLines = content
        .replace(/\r/g, "")
        .replace(/•\s*/g, "- ")
        .split("\n");

    const lines: string[] = [];

    for (let index = 0; index < rawLines.length; index += 1) {
        const current = rawLines[index].trim();

        if ((current === "-" || current === "•") && rawLines[index + 1]) {
            lines.push(`- ${rawLines[index + 1].trim()}`);
            index += 1;
            continue;
        }

        lines.push(current);
    }

    return lines;
}

function ChatMessageContent({ content }: { content: string }) {
    const lines = normalizeMessageLines(content);

    const recipes = lines.slice(1).filter(Boolean);
    if (lines[0] === "**Receitas sugeridas**" && recipes.length > 0 &&
        recipes.length % 2 === 0 &&
        recipes.every((line, index) => index % 2 === 0
            ? /^\*\*.+\*\*$/.test(line)
            : line.startsWith("Do estoque · "))) {
        return (
            <section className="chat-recipe-results" aria-label="Receitas sugeridas">
                <div className="chat-section-title">Receitas sugeridas</div>
                <ol className="chat-recipe-cards">
                    {recipes.filter((_, index) => index % 2 === 0).map((name, index) => (
                        <li key={index}>
                            <strong>{name.slice(2, -2)}</strong>
                            <p>{recipes[index * 2 + 1]}</p>
                        </li>
                    ))}
                </ol>
            </section>
        );
    }

    return (
        <div className="chat-message-content">
            {lines.map((line, index) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return (
                        <div
                            className="chat-message-spacer"
                            key={`space-${index}`}
                        />
                    );
                }

                if (
                    trimmed.startsWith("**") &&
                    trimmed.endsWith("**") &&
                    trimmed.indexOf("**", 2) === trimmed.length - 2
                ) {
                    return (
                        <div
                            className="chat-section-title"
                            key={`title-${index}`}
                        >
                            {trimmed.slice(2, -2)}
                        </div>
                    );
                }

                if (trimmed.startsWith("- ")) {
                    return (
                        <div
                            className="chat-list-item"
                            key={`list-${index}`}
                        >
                            <span className="chat-list-bullet">•</span>
                            <span>{renderInline(trimmed.slice(2))}</span>
                        </div>
                    );
                }

                const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

                if (orderedMatch) {
                    return (
                        <div
                            className="chat-list-item chat-list-item-ordered"
                            key={`ordered-${index}`}
                        >
                            <span className="chat-list-number">
                                {orderedMatch[1]}.
                            </span>
                            <span>{renderInline(orderedMatch[2])}</span>
                        </div>
                    );
                }

                return (
                    <p key={`paragraph-${index}`}>
                        {renderInline(trimmed)}
                    </p>
                );
            })}
        </div>
    );
}

function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [actions, setActions] = useState<string[]>(examples);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadHistory() {
            try {
                const history = await getChatHistory();
                setMessages(history);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Erro ao carregar a conversa."
                );
            } finally {
                setLoading(false);
            }
        }

        void loadHistory();
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, sending]);

    function applyResult(result: ChatResponse) {
        setMessages((current) => [
            ...current,
            {
                role: "assistant",
                content: result.reply
            }
        ]);

        setActions(
            result.actions.length
                ? result.actions
                : examples
        );

        if (result.changed) {
            setNotice(
                "Alteração confirmada e salva no estoque."
            );
        }
    }

    async function send(message: string) {
        const text = message.trim();

        if (!text || sending) {
            return;
        }

        setSending(true);
        setDraft("");
        setError("");
        setNotice("");

        setMessages((current) => [
            ...current,
            { role: "user", content: text }
        ]);

        try {
            const result = await sendChatMessage(text);
            applyResult(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Erro ao enviar mensagem."
            );
        } finally {
            setSending(false);
        }
    }

    async function resolvePending(
        decision: "confirm" | "cancel"
    ) {
        if (sending) {
            return;
        }

        setSending(true);
        setError("");
        setNotice("");

        const label = decision === "confirm"
            ? "Confirmar"
            : "Cancelar";

        setMessages((current) => [
            ...current,
            { role: "user", content: label }
        ]);

        try {
            const result = await resolveChatPending(decision);
            applyResult(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Erro ao resolver a alteração."
            );
        } finally {
            setSending(false);
        }
    }

    function handleAction(action: string) {
        const normalized = action.trim().toLowerCase();

        if (normalized === "confirmar") {
            void resolvePending("confirm");
            return;
        }

        if (normalized === "cancelar") {
            void resolvePending("cancel");
            return;
        }

        void send(action);
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        void send(draft);
    }

    async function handleClear() {
        if (
            !window.confirm(
                "Apagar a conversa? O estoque será mantido."
            )
        ) {
            return;
        }

        try {
            await clearChatHistory();
            setMessages([]);
            setActions(examples);
            setNotice("Conversa apagada. O estoque foi mantido.");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Erro ao apagar a conversa."
            );
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Assistente IntelliFit</h1>
                    <p className="page-description">
                        Converse em linguagem natural e controle
                        seu estoque pelo próprio chat.
                    </p>
                </div>
            </div>

            <div className="chat-card">
                <div className="chat-header chat-header-row">
                    <div>
                        <h2>Assistente IntelliFit</h2>
                        <p>
                            Consulte seu estoque, registre alterações
                            e veja sugestões de receitas.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="button-secondary chat-clear-button"
                        onClick={() => void handleClear()}
                        disabled={sending}
                    >
                        Limpar conversa
                    </button>
                </div>

                <div className="chat-messages" aria-live="polite">
                    <div className="chat-message assistant">
                        <ChatMessageContent
                            content={
                                "Olá! Posso consultar seu estoque, acompanhar validades, registrar compras e consumo e sugerir receitas com os alimentos disponíveis."
                            }
                        />
                    </div>

                    {loading && (
                        <div className="chat-message assistant">
                            <p>Carregando conversa...</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={`${message.role}-${index}`}
                            className={`chat-message ${message.role}`}
                        >
                            <ChatMessageContent content={message.content} />
                        </div>
                    ))}

                    {sending && (
                        <div className="chat-message assistant chat-typing">
                            <p>Processando...</p>
                        </div>
                    )}

                    <div ref={endRef} />
                </div>

                <div className="chat-actions">
                    {actions.map((action) => {
                        const normalized = action.toLowerCase();
                        const isConfirm = normalized === "confirmar";
                        const isCancel = normalized === "cancelar";

                        return (
                            <button
                                key={action}
                                type="button"
                                className={
                                    isConfirm
                                        ? "chat-action-confirm"
                                        : isCancel
                                            ? "chat-action-cancel"
                                            : "button-secondary"
                                }
                                onClick={() => handleAction(action)}
                                disabled={sending}
                            >
                                {action}
                            </button>
                        );
                    })}
                </div>

                {notice && (
                    <p className="chat-notice">
                        {notice}
                    </p>
                )}

                {error && (
                    <p className="form-error chat-error">
                        {error}
                    </p>
                )}

                <form
                    className="chat-input-area"
                    onSubmit={handleSubmit}
                >
                    <input
                        type="text"
                        maxLength={2000}
                        value={draft}
                        onChange={(event) =>
                            setDraft(event.target.value)
                        }
                        placeholder="Ex.: comprei 2 L de leite"
                        disabled={sending}
                    />

                    <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                    >
                        {sending ? "Enviando..." : "Enviar"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Chat;
