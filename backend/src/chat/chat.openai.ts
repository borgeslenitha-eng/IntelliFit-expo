import { todayInBrazilIso } from "../utils/expiration";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-luna";

export type OpenAIOutputItem = {
    type: string;
    name?: string;
    arguments?: string;
    call_id?: string;
    content?: Array<{ type: string; text?: string }>;
};
export type OpenAIResponse = { output: OpenAIOutputItem[] };
export type ChatLanguageModel = (
    input: unknown[],
    tools: unknown[],
) => Promise<OpenAIResponse>;

export function buildTools() {
    return [
        {
            type: "function",
            name: "list_foods",
            description:
                "Lista ou procura alimentos no estoque real do usuário.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description:
                            "Nome do alimento. Use string vazia para listar tudo.",
                    },
                    storageLocation: {
                        type: "string",
                        enum: ["", "DESPENSA", "GELADEIRA", "FREEZER"],
                    },
                },
                required: ["query", "storageLocation"],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "list_expiring",
            description:
                "Lista alimentos vencidos ou que vencem em determinado número de dias.",
            parameters: {
                type: "object",
                properties: {
                    days: {
                        type: "integer",
                        minimum: 0,
                        maximum: 365,
                        description: "Janela em dias a partir de hoje.",
                    },
                    includeExpired: {
                        type: "boolean",
                        description:
                            "Inclui vencidos junto da janela futura quando true.",
                    },
                    onlyExpired: {
                        type: "boolean",
                        description:
                            "Quando true, retorna somente alimentos já vencidos.",
                    },
                },
                required: ["days", "includeExpired", "onlyExpired"],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "stock_summary",
            description:
                "Retorna um resumo numérico do estoque real do usuário.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "recommend_recipes",
            description:
                "Usa o modelo de Machine Learning do IntelliFit para recomendar receitas com base no estoque.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "get_recipe_details",
            description:
                "Obtém ingredientes e modo de preparo em português de uma receita recomendada recentemente. Se o usuário não indicar qual receita, envie recipe como string vazia para o backend pedir a escolha.",
            parameters: {
                type: "object",
                properties: {
                    recipe: {
                        type: "string",
                        description:
                            "Nome da receita mencionada pelo usuário ou string vazia quando não houver nome explícito.",
                    },
                },
                required: ["recipe"],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "create_food",
            description:
                "Use quando o usuário indicar, em linguagem natural, que um alimento entrou no estoque. Identifique a intenção semanticamente, sem depender de verbos específicos. Informe somente dados realmente fornecidos ou claramente expressos; use null quando quantidade, unidade, local ou validade não estiverem explícitos. O backend valida, coleta o que faltar e só grava após confirmação.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: ["string", "null"] },
                    quantity: { type: ["number", "null"], exclusiveMinimum: 0 },
                    unit: {
                        type: ["string", "null"],
                        enum: [
                            "un",
                            "g",
                            "kg",
                            "ml",
                            "L",
                            null,
                        ],
                    },
                    storageLocation: {
                        type: ["string", "null"],
                        enum: ["DESPENSA", "GELADEIRA", "FREEZER", null],
                    },
                    expirationDate: {
                        type: ["string", "null"],
                        description:
                            "Data YYYY-MM-DD apenas quando o usuário informou uma data; caso contrário use null.",
                    },
                },
                required: [
                    "name",
                    "quantity",
                    "unit",
                    "storageLocation",
                    "expirationDate",
                ],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "consume_food",
            description:
                "Use somente quando o usuário indicar claramente que quer registrar consumo, retirada ou descarte de um alimento do estoque. Não use porque ele apenas comentou que cozinhou, gostou ou falou sobre uma receita. O backend valida quantidade, unidade, saldo, lotes e exige confirmação.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    quantity: { type: "number", exclusiveMinimum: 0 },
                    unit: {
                        type: ["string", "null"],
                        enum: [
                            "un",
                            "g",
                            "kg",
                            "ml",
                            "L",
                            null,
                        ],
                        description:
                            "Unidade padronizada informada pelo usuário ou null quando não houver.",
                    },
                    includeExpired: {
                        type: "boolean",
                        description:
                            "Use true somente quando o usuário quiser explicitamente descartar/remover alimento vencido ou impróprio. Para consumo normal use false.",
                    },
                },
                required: ["name", "quantity", "unit", "includeExpired"],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "update_food",
            description:
                "Use quando o usuário indicar claramente, em linguagem natural, que quer alterar um alimento existente. Somente os campos informados são alterados. Se o usuário pedir para mudar a validade sem dizer a data, chame esta função com expirationDate null. O backend vai pedir a data antes de montar a proposta.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    newName: { type: ["string", "null"] },
                    category: { type: ["string", "null"] },
                    quantity: { type: ["number", "null"] },
                    unit: {
                        type: ["string", "null"],
                        enum: [
                            "un",
                            "g",
                            "kg",
                            "ml",
                            "L",
                            null,
                        ],
                    },
                    storageLocation: {
                        type: ["string", "null"],
                        enum: ["DESPENSA", "GELADEIRA", "FREEZER", null],
                    },
                    expirationDate: {
                        type: ["string", "null"],
                        description: "Nova data YYYY-MM-DD ou null.",
                    },
                },
                required: [
                    "name",
                    "newName",
                    "category",
                    "quantity",
                    "unit",
                    "storageLocation",
                    "expirationDate",
                ],
                additionalProperties: false,
            },
            strict: true,
        },
        {
            type: "function",
            name: "delete_food",
            description:
                "Use somente quando o usuário indicar claramente, em linguagem natural, que quer excluir um alimento do estoque. O backend exige confirmação antes de excluir.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
            },
            strict: true,
        },
    ];
}

export function openAIInstructions(): string {
    return `Você é o Assistente IntelliFit, integrado à aplicação de controle de alimentos.
Hoje é ${todayInBrazilIso()} no fuso de São Paulo.
Responda sempre em português do Brasil, de forma curta e prática.

REGRAS IMPORTANTES:
- Você só ajuda com o IntelliFit: estoque de alimentos, compras, consumo, validade, desperdício e receitas.
- Para qualquer dado do estoque, use as funções fornecidas. Nunca invente alimentos, quantidades ou datas.
- O backend devolve a data e o status de validade. Nunca recalcule validade por conta própria. Para hoje e amanhã, preserve esses termos; nas demais datas, use DD/MM/AAAA.
- Para recomendar receitas, use recommend_recipes. Essa função chama o modelo de Machine Learning do projeto. Para pedir somente vencidos, use list_expiring com onlyExpired=true.
- Para ingredientes e modo de preparo de uma receita, use get_recipe_details.
- Se o usuário citar a receita pela posição na lista ("a primeira", "a segunda", "a última", "opção 2"), envie esse trecho exatamente como veio no campo recipe; o backend resolve a posição.
- Para perguntas sobre UM alimento específico ("o leite vence hoje?", "quanto tenho de arroz?"), use list_foods com o nome dele; não liste o estoque inteiro nem todos os vencimentos.
- O ML trabalha com os dados originais da TheMealDB; a tradução para pt-BR acontece depois do ranking, somente para apresentação.
- Para cadastrar, consumir, editar ou excluir, use a função correspondente. O backend cria uma proposta e exige confirmação; nunca diga que uma alteração foi concluída antes da confirmação.
- Use somente as unidades padronizadas: un, g, kg, ml e L. O backend converte apenas g↔kg e ml↔L.
- Caixa, pacote, lata e garrafa NÃO são unidades. Se o usuário falar assim ("comprei 8 caixas de ovos", "tomei 1 caixa de leite"), chame a função normalmente com unit null; o backend pede a quantidade em uma unidade padronizada. Nunca invente equivalências (ex.: 1 caixa = 12 un).
- Ao perguntar a unidade, sugira apenas medidas do alimento: un, g ou kg para ovos; para outros alimentos, selecione entre un, g, kg, ml e L conforme fizer sentido.
- Você é responsável por interpretar semanticamente a intenção do usuário em linguagem natural. Não dependa de uma lista fixa de palavras-chave para decidir entre consultar, cadastrar, consumir, editar ou excluir.
- Ao identificar uma entrada de alimento no estoque, chame create_food mesmo que faltem dados, mas envie null para qualquer campo não informado. Nunca complete local ou validade por suposição.
- Se a intenção for ambígua, faça uma pergunta curta para esclarecer. Não adivinhe a ação, o alimento ou a quantidade.
- Para pedidos de descarte, use consume_food com includeExpired true.
- Ao identificar consumo, retirada ou descarte, chame consume_food somente quando a intenção de dar baixa no estoque estiver clara. Não transforme comentários como "fiz a receita" ou "ficou ótimo" em consumo de ingredientes.
- Uma recomendação de receita não significa que o usuário decidiu prepará-la. Só consulte ingredientes ou modo de preparo quando ele pedir isso explicitamente ou quando estiver respondendo a uma escolha de receita solicitada pelo próprio sistema.
- Quando uma função devolver uma resposta pronta, use essa resposta sem recalcular os dados.
- Quando precisar responder sem resposta pronta, use Markdown simples e legível: uma informação por linha, listas com hífen e negrito apenas para rótulos importantes. Nunca coloque uma lista inteira na mesma linha.
- Não trate assuntos fora do escopo. Diga brevemente que o assistente é focado no IntelliFit.
- Não forneça orientação médica ou nutricional clínica.
- Não tente acessar dados de outros usuários.`;
}

export async function callOpenAI(
    input: unknown[],
    tools: unknown[],
): Promise<OpenAIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY não configurada no backend.");
    }

    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
            reasoning: { effort: "none" },
            instructions: openAIInstructions(),
            input,
            tools,
            tool_choice: "auto",
            max_output_tokens: 500,
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        const message =
            payload?.error?.message || "Erro ao consultar a OpenAI API.";
        throw new Error(message);
    }

    if (!payload || !Array.isArray(payload.output)) {
        throw new Error("Resposta inválida do provedor do chatbot.");
    }
    return payload as OpenAIResponse;
}

export function outputText(response: OpenAIResponse): string {
    const texts: string[] = [];

    for (const item of response?.output ?? []) {
        if (item?.type !== "message") {
            continue;
        }

        for (const content of item?.content ?? []) {
            if (
                content?.type === "output_text" &&
                typeof content.text === "string"
            ) {
                texts.push(content.text);
            }
        }
    }

    return texts.join("\n").trim();
}
