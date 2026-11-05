import { pool } from "../config/database";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-luna";
const CACHE_VERSION = 3;

export type RecipeIngredientPt = {
    name: string;
    measure: string;
};

export type RecipeSummaryForLocalization = {
    idMeal: string;
    strMeal: string;
    strCategory: string;
    strArea: string;
};

export type LocalizedRecipeSummary = {
    idMeal: string;
    namePt: string;
    categoryPt: string;
    areaPt: string;
    translated: boolean;
};

export type LocalizedRecipeDetails = LocalizedRecipeSummary & {
    ingredientsPt: RecipeIngredientPt[];
    preparationStepsPt: string[];
};

type SourceIngredient = {
    name: string;
    measure: string;
};

function responseText(response: any): string {
    const parts: string[] = [];

    for (const item of response?.output ?? []) {
        if (item?.type !== "message") {
            continue;
        }

        for (const content of item?.content ?? []) {
            if (
                content?.type === "output_text" &&
                typeof content.text === "string"
            ) {
                parts.push(content.text);
            }
        }
    }

    return parts.join("\n").trim();
}

async function callStructuredOpenAI(
    schemaName: string,
    schema: Record<string, unknown>,
    input: string,
    maxOutputTokens: number
): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY não configurada no backend.");
    }

    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
            reasoning: { effort: "none" },
            instructions:
                "Você localiza conteúdo culinário para português do Brasil. " +
                "Traduza de forma natural, preserve nomes de marcas quando necessário, " +
                "não invente ingredientes, quantidades, etapas ou informações ausentes. " +
                "Nos ingredientes, faça medida e nome formarem uma expressão natural em pt-BR; " +
                "adapte observações como separated, chopped ou sliced sem alterar o significado. " +
                "Converta somente linguagem e apresentação; mantenha o conteúdo original.",
            input: [
                {
                    role: "user",
                    content: input
                }
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: schemaName,
                    strict: true,
                    schema
                }
            },
            max_output_tokens: maxOutputTokens
        })
    });

    const payload = await response.json();

    if (!response.ok) {
        const message =
            payload?.error?.message ||
            "Erro ao traduzir a receita com a OpenAI API.";
        throw new Error(message);
    }

    const text = responseText(payload);

    if (!text) {
        throw new Error("A OpenAI API não retornou a tradução da receita.");
    }

    return JSON.parse(text);
}

function extractSourceIngredients(
    recipe: Record<string, unknown>
): SourceIngredient[] {
    const ingredients: SourceIngredient[] = [];

    for (let index = 1; index <= 20; index += 1) {
        const name = recipe[`strIngredient${index}`];
        const measure = recipe[`strMeasure${index}`];

        if (typeof name === "string" && name.trim()) {
            ingredients.push({
                name: name.trim(),
                measure:
                    typeof measure === "string"
                        ? measure.trim()
                        : ""
            });
        }
    }

    return ingredients;
}

export class RecipeLocalizationService {
    private async getCachedSummary(
        idMeal: string
    ): Promise<LocalizedRecipeSummary | null> {
        try {
            const result = await pool.query(
                `SELECT id_meal, name_pt, category_pt, area_pt
                 FROM recipe_translation_cache
                 WHERE id_meal=$1
                   AND localization_version=$2`,
                [idMeal, CACHE_VERSION]
            );

            const row = result.rows[0];

            if (!row?.name_pt || !row?.category_pt || !row?.area_pt) {
                return null;
            }

            return {
                idMeal: row.id_meal,
                namePt: row.name_pt,
                categoryPt: row.category_pt,
                areaPt: row.area_pt,
                translated: true
            };
        } catch (error: any) {
            if (error?.code === "42P01" || error?.code === "42703") {
                return null;
            }

            throw error;
        }
    }

    private async getCachedDetails(
        idMeal: string
    ): Promise<LocalizedRecipeDetails | null> {
        try {
            const result = await pool.query(
                `SELECT id_meal, name_pt, category_pt, area_pt,
                        ingredients_pt, preparation_steps_pt
                 FROM recipe_translation_cache
                 WHERE id_meal=$1
                   AND localization_version=$2`,
                [idMeal, CACHE_VERSION]
            );

            const row = result.rows[0];

            if (
                !row?.name_pt ||
                !row?.category_pt ||
                !row?.area_pt ||
                !Array.isArray(row?.ingredients_pt) ||
                !Array.isArray(row?.preparation_steps_pt)
            ) {
                return null;
            }

            return {
                idMeal: row.id_meal,
                namePt: row.name_pt,
                categoryPt: row.category_pt,
                areaPt: row.area_pt,
                translated: true,
                ingredientsPt: row.ingredients_pt,
                preparationStepsPt: row.preparation_steps_pt
            };
        } catch (error: any) {
            if (error?.code === "42P01" || error?.code === "42703") {
                return null;
            }

            throw error;
        }
    }

    private async upsertSummary(
        source: RecipeSummaryForLocalization,
        localized: LocalizedRecipeSummary
    ): Promise<void> {
        try {
            await pool.query(
                `INSERT INTO recipe_translation_cache(
                    id_meal,
                    original_name,
                    name_pt,
                    category_pt,
                    area_pt,
                    localization_version,
                    updated_at
                 )
                 VALUES($1, $2, $3, $4, $5, $6, NOW())
                 ON CONFLICT (id_meal)
                 DO UPDATE SET
                    original_name=EXCLUDED.original_name,
                    name_pt=EXCLUDED.name_pt,
                    category_pt=EXCLUDED.category_pt,
                    area_pt=EXCLUDED.area_pt,
                    localization_version=EXCLUDED.localization_version,
                    updated_at=NOW()`,
                [
                    source.idMeal,
                    source.strMeal,
                    localized.namePt,
                    localized.categoryPt,
                    localized.areaPt,
                    CACHE_VERSION
                ]
            );
        } catch (error: any) {
            if (error?.code !== "42P01" && error?.code !== "42703") {
                throw error;
            }
        }
    }

    private async upsertDetails(
        source: RecipeSummaryForLocalization,
        localized: LocalizedRecipeDetails
    ): Promise<void> {
        try {
            await pool.query(
                `INSERT INTO recipe_translation_cache(
                    id_meal,
                    original_name,
                    name_pt,
                    category_pt,
                    area_pt,
                    ingredients_pt,
                    preparation_steps_pt,
                    localization_version,
                    updated_at
                 )
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                 ON CONFLICT (id_meal)
                 DO UPDATE SET
                    original_name=EXCLUDED.original_name,
                    name_pt=EXCLUDED.name_pt,
                    category_pt=EXCLUDED.category_pt,
                    area_pt=EXCLUDED.area_pt,
                    ingredients_pt=EXCLUDED.ingredients_pt,
                    preparation_steps_pt=EXCLUDED.preparation_steps_pt,
                    localization_version=EXCLUDED.localization_version,
                    updated_at=NOW()`,
                [
                    source.idMeal,
                    source.strMeal,
                    localized.namePt,
                    localized.categoryPt,
                    localized.areaPt,
                    JSON.stringify(localized.ingredientsPt),
                    JSON.stringify(localized.preparationStepsPt),
                    CACHE_VERSION
                ]
            );
        } catch (error: any) {
            if (error?.code !== "42P01" && error?.code !== "42703") {
                throw error;
            }
        }
    }

    public async localizeSummaries(
        recipes: RecipeSummaryForLocalization[]
    ): Promise<Map<string, LocalizedRecipeSummary>> {
        const localized = new Map<string, LocalizedRecipeSummary>();
        const missing: RecipeSummaryForLocalization[] = [];

        for (const recipe of recipes) {
            const cached = await this.getCachedSummary(recipe.idMeal);

            if (cached) {
                localized.set(recipe.idMeal, cached);
            } else {
                missing.push(recipe);
            }
        }

        if (!missing.length) {
            return localized;
        }

        const schema = {
            type: "object",
            properties: {
                translations: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            idMeal: { type: "string" },
                            namePt: { type: "string" },
                            categoryPt: { type: "string" },
                            areaPt: { type: "string" }
                        },
                        required: [
                            "idMeal",
                            "namePt",
                            "categoryPt",
                            "areaPt"
                        ],
                        additionalProperties: false
                    }
                }
            },
            required: ["translations"],
            additionalProperties: false
        };

        try {
            const payload = await callStructuredOpenAI(
                "recipe_summary_localization",
                schema,
                "Traduza para pt-BR os nomes, categorias e origens das receitas abaixo. " +
                    "Preserve o idMeal exatamente como recebido.\n" +
                    JSON.stringify(missing),
                1200
            );

            const translations = Array.isArray(payload?.translations)
                ? payload.translations
                : [];

            for (const source of missing) {
                const match = translations.find(
                    (item: any) => item?.idMeal === source.idMeal
                );

                const item: LocalizedRecipeSummary = match
                    ? {
                        idMeal: source.idMeal,
                        namePt: String(match.namePt),
                        categoryPt: String(match.categoryPt),
                        areaPt: String(match.areaPt),
                        translated: true
                    }
                    : {
                        idMeal: source.idMeal,
                        namePt: source.strMeal,
                        categoryPt: source.strCategory,
                        areaPt: source.strArea,
                        translated: false
                    };

                localized.set(source.idMeal, item);

                if (item.translated) {
                    await this.upsertSummary(source, item);
                }
            }
        } catch (error) {
            console.warn("Não foi possível traduzir o resumo das receitas.", error);

            for (const source of missing) {
                localized.set(source.idMeal, {
                    idMeal: source.idMeal,
                    namePt: source.strMeal,
                    categoryPt: source.strCategory,
                    areaPt: source.strArea,
                    translated: false
                });
            }
        }

        return localized;
    }

    public async localizeDetails(
        recipe: Record<string, unknown>
    ): Promise<LocalizedRecipeDetails> {
        const idMeal = String(recipe.idMeal ?? "");
        const cached = await this.getCachedDetails(idMeal);

        if (cached) {
            return cached;
        }

        const source: RecipeSummaryForLocalization = {
            idMeal,
            strMeal: String(recipe.strMeal ?? ""),
            strCategory: String(recipe.strCategory ?? ""),
            strArea: String(recipe.strArea ?? "")
        };

        const sourceIngredients = extractSourceIngredients(recipe);
        const sourceInstructions = String(recipe.strInstructions ?? "");

        const schema = {
            type: "object",
            properties: {
                idMeal: { type: "string" },
                namePt: { type: "string" },
                categoryPt: { type: "string" },
                areaPt: { type: "string" },
                ingredientsPt: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            measure: { type: "string" }
                        },
                        required: ["name", "measure"],
                        additionalProperties: false
                    }
                },
                preparationStepsPt: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: [
                "idMeal",
                "namePt",
                "categoryPt",
                "areaPt",
                "ingredientsPt",
                "preparationStepsPt"
            ],
            additionalProperties: false
        };

        try {
            const payload = await callStructuredOpenAI(
                "recipe_details_localization",
                schema,
                "Localize esta receita para português do Brasil. " +
                    "Quebre o modo de preparo em etapas curtas e ordenadas. " +
                    "Não altere quantidades nem ingredientes.\n" +
                    JSON.stringify({
                        ...source,
                        ingredients: sourceIngredients,
                        instructions: sourceInstructions
                    }),
                2400
            );

            const localized: LocalizedRecipeDetails = {
                idMeal,
                namePt: String(payload.namePt),
                categoryPt: String(payload.categoryPt),
                areaPt: String(payload.areaPt),
                translated: true,
                ingredientsPt: Array.isArray(payload.ingredientsPt)
                    ? payload.ingredientsPt.map((item: any) => ({
                        name: String(item.name ?? ""),
                        measure: String(item.measure ?? "")
                    }))
                    : sourceIngredients,
                preparationStepsPt: Array.isArray(payload.preparationStepsPt)
                    ? payload.preparationStepsPt.map((step: any) => String(step))
                    : [sourceInstructions]
            };

            await this.upsertDetails(source, localized);
            return localized;
        } catch (error) {
            console.warn("Não foi possível traduzir os detalhes da receita.", error);

            return {
                idMeal,
                namePt: source.strMeal,
                categoryPt: source.strCategory,
                areaPt: source.strArea,
                translated: false,
                ingredientsPt: sourceIngredients,
                preparationStepsPt: sourceInstructions
                    ? [sourceInstructions]
                    : []
            };
        }
    }
}
