import assert from "node:assert/strict";
import test from "node:test";
import { MealDbClient, RecipeSourceError } from "../src/services/mealdb.client";
import { RecipeService } from "../src/services/recipe.service";
import type { MealDetails } from "../src/interfaces/recipe.interface";
import type { Food } from "../src/interfaces/food.interface";
import { todayInBrazilIso } from "../src/utils/expiration";

const meal: MealDetails = {
    idMeal: "1",
    strMeal: "Egg dish",
    strMealThumb: "",
    strInstructions: "Cook.",
    strCategory: "Test",
    strArea: "Test",
    strIngredient1: "Egg",
};
const json = (meals: unknown) =>
    new Response(JSON.stringify({ meals }), {
        headers: { "Content-Type": "application/json" },
    });
const localizer = {
    localizeSummaries: async () => new Map(),
    localizeDetails: async (recipe: Record<string, unknown>) => ({
        idMeal: String(recipe.idMeal),
        namePt: String(recipe.strMeal),
        categoryPt: "Test",
        areaPt: "Test",
        translated: false,
        ingredientsPt: [],
        preparationStepsPt: [],
    }),
};
const food = (name: string): Food => ({
    id: 1,
    userId: 1,
    name,
    category: "Test",
    quantity: 1,
    unit: "un",
    storageLocation: "GELADEIRA",
    expirationDate: new Date(`${todayInBrazilIso()}T12:00:00Z`),
    createdAt: new Date(),
});

test("Uma falha de conexão temporária é repetida e a resposta válida é reutilizada", async () => {
    let calls = 0;
    const client = new MealDbClient({
        fetcher: async (_url, options) => {
            calls++;
            assert.ok(options?.signal);
            if (calls === 1)
                throw new TypeError("fetch failed", {
                    cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
                });
            return json([meal]);
        },
    });
    assert.equal((await client.getById("1"))?.idMeal, "1");
    assert.equal((await client.getById("1"))?.idMeal, "1");
    assert.equal(calls, 2);
});

test("Falha persistente gera erro 503 compreensível sem expor fetch failed", async () => {
    let calls = 0;
    const client = new MealDbClient({
        maxAttempts: 2,
        fetcher: async () => {
            calls++;
            throw new TypeError("fetch failed");
        },
    });
    await assert.rejects(client.searchByIngredient("egg"), (error) => {
        assert.ok(error instanceof RecipeSourceError);
        assert.equal(error.statusCode, 503);
        assert.match(error.message, /serviço de receitas/);
        assert.doesNotMatch(error.message, /fetch failed/);
        return true;
    });
    assert.equal(calls, 2);
});

test("Um cache recente ainda pode ser usado quando a atualização falha", async () => {
    let calls = 0;
    const client = new MealDbClient({
        cacheTtlMs: 0,
        maxAttempts: 1,
        fetcher: async () => {
            if (++calls > 1) throw new TypeError("fetch failed");
            return json([meal]);
        },
    });
    await client.getById("1");
    assert.equal((await client.getById("1"))?.idMeal, "1");
    assert.equal(calls, 2);
});

test("Resposta vazia não é falha de rede; cancelamento não cria novas tentativas", async () => {
    let calls = 0;
    const client = new MealDbClient({
        fetcher: async () => {
            calls++;
            return json(null);
        },
    });
    assert.deepEqual(await client.searchByIngredient("egg"), []);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
        client.getById("2", controller.signal),
        RecipeSourceError,
    );
    assert.equal(calls, 1);
});

test("Uma receita com falha não elimina as demais e o ranking continua sendo ML", async () => {
    const source = {
        searchByIngredient: async () => [meal, { ...meal, idMeal: "bad" }],
        getById: async (id: string) => {
            if (id === "bad") throw new RecipeSourceError();
            return meal;
        },
    };
    const service = new RecipeService({
        source,
        localizationService: localizer,
    });
    const ranking = await service.getRecommendations([food("ovo")]);
    assert.equal(ranking[0].idMeal, "1");
    assert.equal(ranking[0].algorithm, "TF-IDF + k-NN (distância do cosseno)");
});

test("Limita buscas e detalhes a três conexões simultâneas", async () => {
    let active = 0;
    let maximum = 0;
    async function operation<T>(value: T): Promise<T> {
        maximum = Math.max(maximum, ++active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active--;
        return value;
    }
    const source = {
        searchByIngredient: async () =>
            operation(
                Array.from({ length: 8 }, (_, i) => ({
                    ...meal,
                    idMeal: String(i),
                })),
            ),
        getById: async (id: string) => operation({ ...meal, idMeal: id }),
    };
    const service = new RecipeService({
        source,
        localizationService: localizer,
    });
    assert.ok(
        (
            await service.getRecommendations([
                food("ovo"),
                food("leite"),
                food("arroz"),
                food("frango"),
            ])
        ).length,
    );
    assert.equal(maximum, 3);
});

test("Sem saldo válido não acessa a API; indisponibilidade total não vira estoque sem receitas", async () => {
    let calls = 0;
    const service = new RecipeService({
        source: {
            searchByIngredient: async () => {
                calls++;
                throw new RecipeSourceError();
            },
            getById: async () => null,
        },
        localizationService: localizer,
    });
    assert.deepEqual(await service.getRecommendations([]), []);
    assert.equal(calls, 0);
    await assert.rejects(
        service.getRecommendations([food("ovo")]),
        RecipeSourceError,
    );
});
