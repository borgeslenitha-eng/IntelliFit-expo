import type { MealDetails, MealSummary } from "../interfaces/recipe.interface";

export class RecipeSourceError extends Error {
    public readonly statusCode = 503;
    constructor(cause?: unknown) {
        super(
            "Não foi possível conectar ao serviço de receitas no momento. Verifique a conexão com a internet e tente novamente em instantes.",
            { cause },
        );
        this.name = "RecipeSourceError";
    }
}

type MealRecord = MealSummary & Record<string, unknown>;
type CacheEntry = { meals: MealRecord[]; fetchedAt: number };
type ClientOptions = {
    fetcher?: typeof fetch;
    attemptTimeoutMs?: number;
    maxAttempts?: number;
    cacheTtlMs?: number;
};

function isMeal(value: unknown): value is MealRecord {
    if (!value || typeof value !== "object") return false;
    const item = value as Record<string, unknown>;
    return (
        typeof item.idMeal === "string" &&
        typeof item.strMeal === "string" &&
        typeof item.strMealThumb === "string"
    );
}

/** Transporte HTTP independente do ranking ML e das traduções. Cache apenas de dados públicos. */
export class MealDbClient {
    private readonly fetcher: typeof fetch;
    private readonly attemptTimeoutMs: number;
    private readonly maxAttempts: number;
    private readonly cacheTtlMs: number;
    private readonly cache = new Map<string, CacheEntry>();
    private readonly inFlight = new Map<string, Promise<MealRecord[]>>();
    private readonly baseUrl = "https://www.themealdb.com/api/json/v1/1";

    constructor(options: ClientOptions = {}) {
        this.fetcher = options.fetcher ?? fetch;
        this.attemptTimeoutMs = options.attemptTimeoutMs ?? 8000;
        this.maxAttempts = options.maxAttempts ?? 2;
        this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;
    }

    private async request(
        path: string,
        signal?: AbortSignal,
    ): Promise<MealRecord[]> {
        const cached = this.cache.get(path);
        if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs)
            return cached.meals;
        // Compartilha somente requisições sem um prazo externo independente.
        const running = !signal ? this.inFlight.get(path) : undefined;
        if (running) return running;
        const task = this.fetchWithRetry(path, signal).catch((error) => {
            if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000)
                return cached.meals;
            throw error;
        });
        if (!signal) this.inFlight.set(path, task);
        try {
            return await task;
        } finally {
            if (!signal) this.inFlight.delete(path);
        }
    }

    private async fetchWithRetry(
        path: string,
        parentSignal?: AbortSignal,
    ): Promise<MealRecord[]> {
        let failure: unknown;
        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            if (parentSignal?.aborted) break;
            let retryable = true;
            try {
                const timeout = AbortSignal.timeout(this.attemptTimeoutMs);
                const signal = parentSignal
                    ? AbortSignal.any([parentSignal, timeout])
                    : timeout;
                const response = await this.fetcher(this.baseUrl + path, {
                    signal,
                });
                if (!response.ok) {
                    retryable =
                        response.status === 408 ||
                        response.status === 429 ||
                        response.status >= 500;
                    throw new Error(`TheMealDB HTTP ${response.status}`);
                }
                const payload: unknown = await response.json();
                if (
                    !payload ||
                    typeof payload !== "object" ||
                    !("meals" in payload)
                )
                    throw new Error("Resposta inválida da TheMealDB.");
                const mealsValue = (payload as { meals: unknown }).meals;
                if (mealsValue !== null && !Array.isArray(mealsValue))
                    throw new Error("Lista de receitas inválida.");
                const meals =
                    mealsValue === null ? [] : mealsValue.filter(isMeal);
                if (
                    Array.isArray(mealsValue) &&
                    meals.length !== mealsValue.length
                )
                    throw new Error("Receitas com formato inválido.");
                this.cache.set(path, { meals, fetchedAt: Date.now() });
                if (this.cache.size > 256)
                    this.cache.delete(this.cache.keys().next().value!);
                return meals;
            } catch (error) {
                failure = error;
            }
            if (!retryable || parentSignal?.aborted) break;
            // Pequeno intervalo entre tentativas, sem bloquear a thread do servidor.
            if (attempt + 1 < this.maxAttempts)
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 250 * (attempt + 1));
                });
        }
        throw new RecipeSourceError(failure ?? parentSignal?.reason);
    }

    public async searchByIngredient(
        ingredient: string,
        signal?: AbortSignal,
    ): Promise<MealSummary[]> {
        return this.request(
            `/filter.php?i=${encodeURIComponent(ingredient)}`,
            signal,
        );
    }

    public async getById(
        id: string,
        signal?: AbortSignal,
    ): Promise<MealDetails | null> {
        const meals = await this.request(
            `/lookup.php?i=${encodeURIComponent(id)}`,
            signal,
        );
        const meal = meals[0];
        if (!meal) return null;
        if (
            typeof meal.strInstructions !== "string" ||
            typeof meal.strCategory !== "string" ||
            typeof meal.strArea !== "string"
        )
            throw new RecipeSourceError(
                new Error("Detalhes de receita inválidos."),
            );
        return meal as MealDetails;
    }
}

// Uma instância por processo: também atende as chamadas provenientes do chat.
export const mealDbClient = new MealDbClient();
