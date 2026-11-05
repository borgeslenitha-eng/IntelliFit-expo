import { translateIngredient } from "../utils/ingredientMapper";
import { Food } from "../interfaces/food.interface";
import { rankRecipesWithML, RankedRecipe } from "../ml/recipe-recommender";
import { daysUntilExpiration } from "../utils/expiration";
import { RecipeLocalizationService } from "./recipe-localization.service";
import {
    mealDbClient,
    type MealDbClient,
    RecipeSourceError,
} from "./mealdb.client";
import type { MealDetails, MealSummary } from "../interfaces/recipe.interface";

async function mapLimited<T, R>(
    items: T[],
    worker: (item: T) => Promise<R>,
    limit = 3,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (next < items.length) {
                const index = next++;
                results[index] = await worker(items[index]);
            }
        }),
    );
    return results;
}

export type LocalizedRecipeDetailsResponse = MealDetails & {
    originalName: string;
    originalCategory: string;
    originalArea: string;
    localizedIngredients: Array<{
        name: string;
        measure: string;
    }>;
    preparationSteps: string[];
    localizationLanguage: "pt-BR" | "original";
};

export class RecipeService {
    private readonly source: Pick<
        MealDbClient,
        "searchByIngredient" | "getById"
    >;
    private readonly localizationService: Pick<
        RecipeLocalizationService,
        "localizeSummaries" | "localizeDetails"
    >;

    constructor(
        dependencies: {
            source?: Pick<MealDbClient, "searchByIngredient" | "getById">;
            localizationService?: Pick<
                RecipeLocalizationService,
                "localizeSummaries" | "localizeDetails"
            >;
        } = {},
    ) {
        this.source = dependencies.source ?? mealDbClient;
        this.localizationService =
            dependencies.localizationService ?? new RecipeLocalizationService();
    }

    public async searchByIngredient(
        ingredient: string,
        signal?: AbortSignal,
    ): Promise<MealSummary[]> {
        const translated = translateIngredient(ingredient);
        return translated
            ? this.source.searchByIngredient(translated, signal)
            : [];
    }

    public async getById(
        id: string,
        signal?: AbortSignal,
    ): Promise<MealDetails | null> {
        return this.source.getById(id, signal);
    }

    public async getLocalizedById(
        id: string,
    ): Promise<LocalizedRecipeDetailsResponse | null> {
        const recipe = await this.getById(id);

        if (!recipe) {
            return null;
        }

        const localized = await this.localizationService.localizeDetails(
            recipe as unknown as Record<string, unknown>,
        );

        return {
            ...recipe,
            originalName: recipe.strMeal,
            originalCategory: recipe.strCategory,
            originalArea: recipe.strArea,
            strMeal: localized.namePt,
            strCategory: localized.categoryPt,
            strArea: localized.areaPt,
            strInstructions: localized.preparationStepsPt.join("\n"),
            localizedIngredients: localized.ingredientsPt,
            preparationSteps: localized.preparationStepsPt,
            localizationLanguage: localized.translated ? "pt-BR" : "original",
        };
    }

    public async getRecommendations(
        foods: Food[],
        limit = 6,
    ): Promise<RankedRecipe[]> {
        const availableFoods = foods.filter(
            (food) =>
                food.quantity > 0 &&
                daysUntilExpiration(food.expirationDate) >= 0,
        );

        const candidates = new Map<
            string,
            MealSummary & { initialMatches: number }
        >();

        const semanticIngredients = new Map<string, string>();

        for (const food of availableFoods) {
            const translated = translateIngredient(food.name);

            if (translated && !semanticIngredients.has(translated)) {
                semanticIngredients.set(translated, food.name);
            }
        }

        if (!semanticIngredients.size || !Number.isFinite(limit) || limit <= 0)
            return [];
        const deadline = AbortSignal.timeout(20000);
        let failure: unknown;
        const searches = await mapLimited(
            Array.from(semanticIngredients.values()),
            async (sourceName) => {
                try {
                    return await this.searchByIngredient(sourceName, deadline);
                } catch (error) {
                    failure = error;
                    return [];
                }
            },
        );
        for (const recipes of searches) {
            for (const recipe of recipes) {
                const existing = candidates.get(recipe.idMeal);

                if (existing) {
                    existing.initialMatches += 1;
                } else {
                    candidates.set(recipe.idMeal, {
                        ...recipe,
                        initialMatches: 1,
                    });
                }
            }
        }

        const candidateList = Array.from(candidates.values())
            .sort((a, b) => b.initialMatches - a.initialMatches)
            .slice(0, 24);

        const details = await mapLimited(candidateList, async (recipe) => {
            try {
                return await this.getById(recipe.idMeal, deadline);
            } catch (error) {
                failure = error;
                return null;
            }
        });
        const validRecipes = details.filter(
            (recipe): recipe is MealDetails => recipe !== null,
        );
        if (!validRecipes.length && failure)
            throw new RecipeSourceError(failure);

        const ranked = rankRecipesWithML(
            availableFoods as unknown as Array<Record<string, unknown>>,
            validRecipes as unknown as Array<Record<string, unknown>>,
            limit,
        );

        if (!ranked.length) {
            return ranked;
        }

        const translations = await this.localizationService.localizeSummaries(
            ranked.map((recipe) => ({
                idMeal: recipe.idMeal,
                strMeal: recipe.strMeal,
                strCategory: recipe.strCategory,
                strArea: recipe.strArea,
            })),
        );

        return Promise.all(
            ranked.map(async (recipe) => {
                let localized = translations.get(recipe.idMeal);

                if (!localized?.translated) {
                    try {
                        const detailed =
                            await this.localizationService.localizeDetails(
                                recipe as unknown as Record<string, unknown>,
                            );

                        if (detailed.translated) {
                            localized = detailed;
                        }
                    } catch {
                        // Mantém o conteúdo original se a localização falhar.
                    }
                }

                if (!localized) {
                    return recipe;
                }

                return {
                    ...recipe,
                    originalName: recipe.strMeal,
                    originalCategory: recipe.strCategory,
                    originalArea: recipe.strArea,
                    strMeal: localized.namePt,
                    strCategory: localized.categoryPt,
                    strArea: localized.areaPt,
                    localizationLanguage: localized.translated
                        ? "pt-BR"
                        : "original",
                } as RankedRecipe;
            }),
        );
    }
}
