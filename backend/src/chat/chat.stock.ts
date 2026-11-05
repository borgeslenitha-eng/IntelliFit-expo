import { formatMeasurement } from "./chat.presentation";
import { Food } from "../interfaces/food.interface";
import { daysUntilExpiration } from "../utils/expiration";
import {
    convertQuantity,
    getUnitDimension,
    normalizeMeasurementUnit,
    roundQuantity,
    unitsAreCompatible,
} from "../utils/measurement";
import { normalizeText } from "./chat.validation";

export type BatchConsumptionOperation = {
    foodId: number;
    newQuantity: number | null;
};

export type BatchConsumptionPlan = {
    unit: string;
    beforeTotal: number;
    afterTotal: number;
    expiredIgnored: number;
    operations: BatchConsumptionOperation[];
};

function asDateOnly(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    return String(value ?? "").slice(0, 10);
}

export function canonicalFoodName(value: string): string {
    const irregular: Record<string, string> = {
        paes: "pao",
        feijoes: "feijao",
        limoes: "limao",
        graos: "grao",
    };
    return normalizeText(value)
        .split(" ")
        .map(
            (token) =>
                irregular[token] ??
                (token.length > 3 && /[oae]s$/.test(token)
                    ? token.slice(0, -1)
                    : token),
        )
        .join(" ");
}

function significantTokens(value: string): string[] {
    return normalizeText(value)
        .split(" ")
        .filter((token) => token.length >= 3);
}

export function foodGroupsMentioned(foods: Food[], message: string): Food[][] {
    const normalizedMessage = canonicalFoodName(message);
    const messageTokens = new Set(significantTokens(normalizedMessage));
    const groups = new Map<string, Food[]>();

    for (const food of foods) {
        const key = canonicalFoodName(food.name);
        const current = groups.get(key) ?? [];
        current.push(food);
        groups.set(key, current);
    }

    const scored = Array.from(groups.entries())
        .map(([key, group]) => {
            const singular = key.endsWith("s") ? key.slice(0, -1) : key;
            let score = 0;

            if (normalizedMessage.includes(key)) {
                score = 100 + key.length;
            } else if (
                singular.length >= 3 &&
                normalizedMessage.includes(singular)
            ) {
                score = 90 + singular.length;
            } else {
                const foodTokens = significantTokens(key);
                const matches = foodTokens.filter((token) =>
                    messageTokens.has(token),
                );
                if (matches.length) {
                    score =
                        matches.length * 10 +
                        Math.max(...matches.map((token) => token.length));
                }
            }

            return { group, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    if (!scored.length) {
        return [];
    }

    const topScore = scored[0].score;
    return scored
        .filter((entry) => entry.score === topScore)
        .map((entry) => entry.group);
}

export function findMergeableFoods(
    foods: Food[],
    incoming: {
        name: string;
        unit: string;
        storageLocation: string;
        expirationDate: string;
    },
): Food[] {
    const incomingName = canonicalFoodName(incoming.name);
    const incomingUnit = normalizeMeasurementUnit(incoming.unit);

    return foods
        .filter((food) => {
            const foodUnit = normalizeMeasurementUnit(food.unit);
            return (
                canonicalFoodName(food.name) === incomingName &&
                food.storageLocation === incoming.storageLocation &&
                daysUntilExpiration(food.expirationDate) >= 0 &&
                Boolean(
                    incomingUnit &&
                    foodUnit &&
                    unitsAreCompatible(incomingUnit, foodUnit),
                )
            );
        })
        .sort(
            (a, b) =>
                asDateOnly(a.expirationDate).localeCompare(
                    asDateOnly(b.expirationDate),
                ) || a.id - b.id,
        );
}

export function planConsumptionAcrossBatches(
    foods: Food[],
    quantity: number,
    requestedUnit?: string | null,
    options?: { includeExpired?: boolean },
): BatchConsumptionPlan | { error: string } {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return { error: "A quantidade deve ser maior que zero." };
    }

    const includeExpired = Boolean(options?.includeExpired);
    const expiredIgnored = foods.filter(
        (food) => daysUntilExpiration(food.expirationDate) < 0,
    ).length;

    const eligible = foods
        .filter(
            (food) =>
                includeExpired || daysUntilExpiration(food.expirationDate) >= 0,
        )
        .sort((a, b) => {
            const dateCompare = asDateOnly(a.expirationDate).localeCompare(
                asDateOnly(b.expirationDate),
            );
            return dateCompare !== 0 ? dateCompare : a.id - b.id;
        });

    if (!eligible.length) {
        return {
            error: includeExpired
                ? "Não há saldo disponível para esse alimento."
                : expiredIgnored > 0
                  ? "**Todos os lotes estão vencidos.**\n\nPara dar baixa, peça para registrar o descarte."
                  : "Não é possível registrar o consumo: não há saldo disponível deste alimento no estoque.",
        };
    }

    const normalizedRequested = requestedUnit
        ? normalizeMeasurementUnit(requestedUnit)
        : null;

    let unit = normalizedRequested;
    const eligibleUnits = Array.from(
        new Set(
            eligible
                .map((food) => normalizeMeasurementUnit(food.unit))
                .filter((value): value is NonNullable<typeof value> =>
                    Boolean(value),
                ),
        ),
    );

    if (!unit) {
        if (eligibleUnits.length === 1) {
            unit = eligibleUnits[0];
        } else {
            const dimensions = new Set(
                eligibleUnits.map((value) => getUnitDimension(value)),
            );
            if (
                dimensions.size === 1 &&
                (dimensions.has("mass") || dimensions.has("volume"))
            ) {
                unit = eligibleUnits.includes("g")
                    ? "g"
                    : eligibleUnits.includes("ml")
                      ? "ml"
                      : eligibleUnits[0];
            }
        }
    }

    if (!unit) {
        return { error: "Informe a unidade da quantidade consumida." };
    }

    const compatible = eligible.filter((food) =>
        unitsAreCompatible(food.unit, unit!),
    );

    if (!compatible.length) {
        const totals = new Map<string, number>();
        for (const food of eligible) {
            const storedUnit = normalizeMeasurementUnit(food.unit) ?? food.unit;
            totals.set(
                storedUnit,
                (totals.get(storedUnit) ?? 0) + food.quantity,
            );
        }
        const balance = Array.from(totals, ([storedUnit, total]) =>
            formatMeasurement(roundQuantity(total), storedUnit),
        ).join(" e ");
        return {
            error: `**Saldo de ${eligible[0].name}** — **${balance}** disponíveis.\n\nO pedido está em **${unit}**. Informe a quantidade na unidade cadastrada.`,
        };
    }

    const beforeTotal = compatible.reduce((sum, food) => {
        const converted = convertQuantity(food.quantity, food.unit, unit!);
        return sum + (converted ?? 0);
    }, 0);

    if (quantity > beforeTotal + 1e-9) {
        return {
            error: includeExpired
                ? `Não é possível dar baixa em ${roundQuantity(quantity)} ${unit}: o saldo disponível é de apenas ${roundQuantity(beforeTotal)} ${unit}.`
                : `Não é possível registrar o consumo de ${roundQuantity(quantity)} ${unit}: você possui apenas ${roundQuantity(beforeTotal)} ${unit}${expiredIgnored > 0 ? " dentro da validade. Os vencidos ficam fora desse saldo." : " no estoque."}`,
        };
    }

    let remainingToConsume = quantity;
    const operations: BatchConsumptionOperation[] = [];

    for (const food of compatible) {
        if (remainingToConsume <= 1e-9) break;

        const availableInRequested = convertQuantity(
            food.quantity,
            food.unit,
            unit,
        );
        if (availableInRequested === null || availableInRequested <= 0)
            continue;

        const takeInRequested = Math.min(
            remainingToConsume,
            availableInRequested,
        );
        const takeInStockUnit = convertQuantity(
            takeInRequested,
            unit,
            food.unit,
        );
        if (takeInStockUnit === null) continue;

        const newQuantity = roundQuantity(food.quantity - takeInStockUnit);
        operations.push({
            foodId: food.id,
            newQuantity: newQuantity <= 1e-9 ? null : newQuantity,
        });
        remainingToConsume = roundQuantity(
            remainingToConsume - takeInRequested,
        );
    }

    return {
        unit,
        beforeTotal: roundQuantity(beforeTotal),
        afterTotal: roundQuantity(beforeTotal - quantity),
        expiredIgnored: includeExpired ? 0 : expiredIgnored,
        operations,
    };
}

export function findFoodByName(
    foods: Food[],
    name: string,
): { food?: Food; ambiguous?: Food[] } {
    const target = canonicalFoodName(name);

    const exact = foods.filter(
        (food) => canonicalFoodName(food.name) === target,
    );

    if (exact.length === 1) {
        return { food: exact[0] };
    }

    const partial = foods.filter((food) => {
        const current = canonicalFoodName(food.name);
        return current.includes(target) || target.includes(current);
    });

    if (partial.length === 1) {
        return { food: partial[0] };
    }

    if (partial.length > 1) {
        return { ambiguous: partial };
    }

    return {};
}
