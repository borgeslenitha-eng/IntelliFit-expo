import type { Food } from "../interfaces/food.interface";
import type { RankedRecipe } from "../ml/recipe-recommender";
import type { LocalizedRecipeDetailsResponse } from "../services/recipe.service";
import {
    normalizeMeasurementUnit,
    preferredDisplayMeasurement,
} from "../utils/measurement";
import { formatDateBR } from "./chat.validation";
import {
    daysUntilExpiration,
    getExpirationStatus,
    formatExpirationDateForUser,
} from "../utils/expiration";

export function asDateOnly(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return String(value ?? "").slice(0, 10);
}

export function formatFood(food: Food): Record<string, unknown> {
    const expirationDate = asDateOnly(food.expirationDate);
    const daysUntil = daysUntilExpiration(expirationDate);

    return {
        id: food.id,
        name: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: normalizeMeasurementUnit(food.unit) ?? food.unit,
        storageLocation: food.storageLocation,
        expirationDate,
        daysUntilExpiration: daysUntil,
        expirationStatus: getExpirationStatus(expirationDate),
        expirationText:
            daysUntil < 0
                ? `Vencido em ${formatDateBR(expirationDate)}`
                : formatExpirationDateForUser(expirationDate),
    };
}

export function formatQuantity(
    value: unknown,
    maximumFractionDigits = 2,
): string {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return String(value ?? "");
    }

    return new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits,
    }).format(number);
}

export function formatMeasurement(quantity: unknown, unit: string): string {
    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity)) {
        return `${String(quantity ?? "")} ${unit}`.trim();
    }

    const display = preferredDisplayMeasurement(numericQuantity, unit);

    return `${formatQuantity(display.quantity)} ${display.unit}`.trim();
}

export function locationLabel(location: string): string {
    if (location === "GELADEIRA") return "Geladeira";
    if (location === "FREEZER") return "Freezer";
    if (location === "DESPENSA") return "Despensa";
    return location;
}

export function formatFoodBullet(
    food: Record<string, unknown>,
    includeLocation: boolean,
): string {
    const parts = [
        `**${String(food.name ?? "Alimento")}** — ` +
            formatMeasurement(food.quantity, String(food.unit ?? "")),
    ];

    if (includeLocation) {
        parts.push(locationLabel(String(food.storageLocation ?? "")));
    }

    const expirationDate = String(food.expirationDate ?? "");
    const remaining = Number(food.daysUntilExpiration);

    if (!expirationDate) {
        parts.push("Validade não informada");
    } else if (Number.isFinite(remaining) && remaining < 0) {
        parts.push(`Vencido em: ${formatDateBR(expirationDate)}`);
    } else {
        parts.push(`Validade: ${formatExpirationDateForUser(expirationDate)}`);
    }

    return `- ${parts.join(" — ")}`;
}

export function formatFoodListReply(
    foods: Array<Record<string, unknown>>,
    location: string,
    query: string,
): string {
    if (!foods.length) {
        if (location) {
            return `**${locationLabel(location)}**\n\nNenhum alimento cadastrado nesse local.`;
        }

        if (query) {
            return `Não encontrei **${query}** no seu estoque.`;
        }

        return "Seu estoque está vazio.";
    }

    const title = location
        ? `**${locationLabel(location)}**`
        : query
          ? `**Resultado para ${query}**`
          : "**Seu estoque**";

    return [
        title,
        "",
        ...foods.map((food) => formatFoodBullet(food, !location)),
    ].join("\n");
}

export function formatExpiringReply(
    foods: Array<Record<string, unknown>>,
    mode: "expired" | "upcoming" = "upcoming",
    title?: string,
): string {
    if (!foods.length) {
        return mode === "expired"
            ? "Nenhum alimento vencido no estoque."
            : title
              ? `**${title}**\n\nNenhum alimento encontrado nesse período.`
              : "Nenhum alimento encontrado nesse período.";
    }

    return [
        title
            ? `**${title}**`
            : mode === "expired"
              ? "**Alimentos vencidos**"
              : "**Validades do estoque**",
        "",
        ...foods.map((food) => formatFoodBullet(food, true)),
    ].join("\n");
}

export function formatRecipeRecommendations(recipes: RankedRecipe[]): string {
    if (!recipes.length) {
        return "Não encontrei receitas compatíveis com os alimentos válidos do seu estoque.";
    }

    const lines = ["**Receitas sugeridas**", ""];

    for (const recipe of recipes) {
        const matched = Array.isArray(recipe.matchedIngredients)
            ? recipe.matchedIngredients
            : [];

        lines.push(
            matched.length
                ? `**${recipe.strMeal}**\nDo estoque · ${matched.join(", ")}\n`
                : `**${recipe.strMeal}**\n`,
        );
    }

    return lines.join("\n");
}

export function formatRecipeDetailsReply(
    recipe: LocalizedRecipeDetailsResponse,
): string {
    const ingredients = Array.isArray(recipe.localizedIngredients)
        ? recipe.localizedIngredients
        : [];
    const steps = Array.isArray(recipe.preparationSteps)
        ? recipe.preparationSteps
        : [];

    const lines = [`**${recipe.strMeal}**`, "", "**Ingredientes**"];

    if (ingredients.length) {
        for (const ingredient of ingredients) {
            const measure = String(ingredient.measure ?? "").trim();
            const name = String(ingredient.name ?? "").trim();
            lines.push(`- ${measure ? `${measure} ` : ""}${name}`.trim());
        }
    } else {
        lines.push("- Ingredientes não disponíveis.");
    }

    lines.push("", "**Modo de preparo**");

    if (steps.length) {
        steps.forEach((step: string, index: number) => {
            const instruction = step
                .trim()
                .replace(/^\d+[.)]\s+/, "")
                .replace(/\s+/g, " ");
            if (instruction) lines.push(`${index + 1}. ${instruction}`);
        });
    } else {
        lines.push("Modo de preparo não disponível.");
    }

    return lines.join("\n");
}
