import API_URL from "./api";

export interface RecipeIngredient {
    name: string;
    measure: string;
}

export interface Recipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strInstructions: string;
    strCategory: string;
    strArea: string;
    matchingIngredients: number;
    matchedIngredients?: string[];
    missingIngredients?: number;
    mlScore?: number;
    mlDistance?: number;
    neighborRank?: number;
    algorithm?: string;
    originalName?: string;
    originalCategory?: string;
    originalArea?: string;
    localizedIngredients?: RecipeIngredient[];
    preparationSteps?: string[];
    localizationLanguage?: "pt-BR" | "original";
    [key: string]: unknown;
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

function authHeaders() {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`
    };
}

async function recipeRequest<T>(path: string, fallbackMessage: string): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_URL}/api/recipes${path}`, { method: "GET", headers: authHeaders() });
    } catch {
        throw new Error("Não foi possível conectar ao IntelliFit. Verifique se o backend está em execução e tente novamente.");
    }
    const result = await readJson(response);
    if (!response.ok) throw new Error(result.error || fallbackMessage);
    return result;
}

export async function getSuggestedRecipes(): Promise<Recipe[]> {
    return recipeRequest<Recipe[]>("/suggestions", "Não foi possível buscar as receitas.");
}

export async function getRecipeById(id: string): Promise<Recipe> {
    return recipeRequest<Recipe>(`/${encodeURIComponent(id)}`, "Não foi possível buscar a receita.");
}
