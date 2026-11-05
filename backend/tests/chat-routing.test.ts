import assert from "node:assert/strict";
import test from "node:test";
import { createChatService } from "../src/chat/chat.service";
import type { ChatRepository } from "../src/chat/chat.repository";
import type { Food } from "../src/interfaces/food.interface";
import {
    hasStockMutationIntent,
    mentionsAppTopic,
    resolveRecipeOrdinal,
} from "../src/chat/chat.intent";
import { createToolHandler } from "../src/chat/chat.tools";
import { createDraftFlow } from "../src/chat/chat.draft";
import { todayInBrazilIso } from "../src/utils/expiration";

/**
 * Regressão do roteamento: o que o backend responde sozinho (regex) e o que
 * deve seguir para o modelo de linguagem. Para registrar um novo caso com erro,
 * acrescente uma linha em `shouldReachModel` ou `answeredByBackend`.
 */

const today = new Date(`${todayInBrazilIso()}T12:00:00Z`);
const inDays = (n: number) => new Date(today.getTime() + n * 86_400_000);

const foods: Food[] = [
    {
        id: 1,
        userId: 1,
        name: "leite",
        category: "Laticínios",
        quantity: 2,
        unit: "L",
        storageLocation: "GELADEIRA",
        expirationDate: inDays(0),
        createdAt: new Date(),
    },
    {
        id: 2,
        userId: 1,
        name: "ovos",
        category: "Outros",
        quantity: 6,
        unit: "un",
        storageLocation: "GELADEIRA",
        expirationDate: inDays(10),
        createdAt: new Date(),
    },
];

const recipeContext = [
    { idMeal: "100", name: "Omelete de queijo", originalName: "Cheese Omelette" },
    { idMeal: "200", name: "Panqueca", originalName: "Pancakes" },
    { idMeal: "300", name: "Bolo de cenoura", originalName: "Carrot Cake" },
];

function harness() {
    const messages: Array<{ role: string; content: string }> = [];
    const detailRequests: string[] = [];
    let modelCalls = 0;

    const repository: ChatRepository = {
        getPendingAction: async () => null,
        setPendingAction: async () => {},
        getRecipeContext: async () => recipeContext,
        setRecipeContext: async () => {},
        saveMessage: async (_id, role, content) => {
            messages.push({ role, content });
        },
        recentHistory: async () => messages.map((m) => ({ ...m })),
        getChatHistory: async () => [],
        clearChat: async () => {},
        lastAssistantMessage: async () => "",
    };

    const service = createChatService({
        repository,
        foodService: {
            getAllFoods: async () => foods,
            createFood: async () => foods[0],
            updateFood: async () => foods[0],
            deleteFood: async () => {},
            applyBatchConsumption: async () => {},
        },
        recipeService: {
            getRecommendations: async () => [],
            getLocalizedById: async (id: string) => {
                detailRequests.push(id);
                return {
                    idMeal: id,
                    strMeal: `Receita ${id}`,
                    localizedIngredients: [],
                    preparationSteps: ["Misture tudo."],
                } as never;
            },
        },
        languageModel: async () => {
            modelCalls++;
            return {
                output: [
                    {
                        type: "message",
                        content: [{ type: "output_text", text: "[modelo]" }],
                    },
                ],
            };
        },
    });

    return {
        send: (text: string) => service.sendChatMessage(1, text),
        modelCalls: () => modelCalls,
        detailRequests,
    };
}

const shouldReachModel = [
    "Comprei 2 leites e coloquei na geladeira, pode registrar no estoque?",
    "Tirei 3 ovos da geladeira, atualiza o estoque",
    "Usei o leite que estava na geladeira, dá baixa no estoque",
    "O leite vence hoje?",
    "Como fazer para cadastrar um alimento?",
    "Quais ingredientes do estoque vão vencer?",
    "Quais alimentos vencidos nos próximos dias?",
];

for (const message of shouldReachModel) {
    test(`Segue para o modelo (não é atalho): "${message}"`, async () => {
        const chat = harness();
        const result = await chat.send(message);
        assert.equal(chat.modelCalls(), 1, "o modelo deveria interpretar");
        assert.equal(result.reply, "[modelo]");
    });
}

const answeredByBackend: Array<[string, RegExp]> = [
    ["geladeira", /Geladeira/],
    ["O que eu tenho na geladeira?", /Geladeira/],
    ["vencidos", /vencido/i],
    ["quais alimentos vencem nos próximos 3 dias", /Vencimentos/],
];

for (const [message, expected] of answeredByBackend) {
    test(`Consulta objetiva respondida pelo backend: "${message}"`, async () => {
        const chat = harness();
        const result = await chat.send(message);
        assert.equal(chat.modelCalls(), 0);
        assert.match(result.reply, expected);
    });
}

test("Referência ordinal a receitas usa a ordem das sugestões", async () => {
    const cases: Array<[string, string]> = [
        ["modo de preparo da primeira receita", "100"],
        ["como fazer a segunda", "200"],
        ["modo de preparo da última receita", "300"],
        ["como preparar a opção 2", "200"],
        ["como fazer a panqueca", "200"],
    ];
    for (const [message, expectedId] of cases) {
        const chat = harness();
        await chat.send(message);
        assert.deepEqual(chat.detailRequests, [expectedId], message);
    }
});

test("Receita fora das sugestões não reinicia a lista com a pergunta genérica", async () => {
    const chat = harness();
    const result = await chat.send("modo de preparo de lasanha");
    assert.match(result.reply, /Não consegui identificar uma única receita/);
    assert.deepEqual(chat.detailRequests, []);
});

test("Pedido genérico de modo de preparo pergunta qual receita", async () => {
    const chat = harness();
    const result = await chat.send("modo de preparo");
    assert.match(result.reply, /Qual receita você quer preparar/);
});

test("Detecção de verbos que alteram estoque", () => {
    for (const text of [
        "comprei leite",
        "registre 2 ovos",
        "coloquei na geladeira",
        "tirei 3 ovos",
        "consumi o arroz",
        "descarte o iogurte",
    ])
        assert.equal(hasStockMutationIntent(text), true, text);
    for (const text of [
        "o que tenho na geladeira?",
        "o que vence amanhã?",
        "mostre o estoque",
    ])
        assert.equal(hasStockMutationIntent(text), false, text);
});

test("Tema do aplicativo não é confundido com pedido de receita", () => {
    assert.equal(mentionsAppTopic("como fazer para cadastrar um alimento"), true);
    assert.equal(mentionsAppTopic("como fazer a panqueca"), false);
});

test("Resolução de ordinais", () => {
    assert.equal(resolveRecipeOrdinal("a primeira", 3), 0);
    assert.equal(resolveRecipeOrdinal("segunda receita", 3), 1);
    assert.equal(resolveRecipeOrdinal("a última", 3), 2);
    assert.equal(resolveRecipeOrdinal("opção 3", 3), 2);
    assert.equal(resolveRecipeOrdinal("quinta", 3), -1);
    assert.equal(resolveRecipeOrdinal("panqueca", 3), -1);
    assert.equal(resolveRecipeOrdinal("a primeira", 0), -1);
});

test("A ferramenta get_recipe_details também resolve ordinais vindos do modelo", async () => {
    const requested: string[] = [];
    const repository = {
        getPendingAction: async () => null,
        setPendingAction: async () => {},
        getRecipeContext: async () => recipeContext,
        setRecipeContext: async () => {},
    } as never;
    const foodService = { getAllFoods: async () => foods } as never;
    const recipeService = {
        getRecommendations: async () => [],
        getLocalizedById: async (id: string) => {
            requested.push(id);
            return { idMeal: id, strMeal: "x", localizedIngredients: [], preparationSteps: [] } as never;
        },
    } as never;
    const handle = createToolHandler(
        foodService,
        recipeService,
        repository,
        createDraftFlow(foodService, repository),
    );
    await handle(1, "get_recipe_details", { recipe: "a segunda" }, "a segunda");
    assert.deepEqual(requested, ["200"]);
});
