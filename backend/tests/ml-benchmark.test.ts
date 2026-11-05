import assert from "node:assert/strict";
import test from "node:test";
import { rankRecipesWithML } from "../src/ml/recipe-recommender";
import { translateIngredient } from "../src/utils/ingredientMapper";
import {
    benchmarkCatalog,
    benchmarkQueries,
    type BenchmarkQuery,
} from "./fixtures/recipe-benchmark";

/**
 * Avaliação comparativa do recomendador.
 *
 * O que ela mostra (e o que NÃO mostra):
 *  - compara TF-IDF + k-NN com dois baselines simples sobre relevância graduada
 *    escrita à mão em um catálogo sintético pequeno. Nessa escala os métodos
 *    ficam próximos do teto; não se deve afirmar superioridade do TF-IDF.
 *  - mede o efeito da ponderação por validade, que é a contribuição que os
 *    baselines não têm: o ingrediente prestes a vencer aparece com mais
 *    frequência nas primeiras recomendações.
 */

const DAY = 86_400_000;
const isoIn = (days: number) =>
    new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

function ingredientsOf(recipe: Record<string, unknown>): string[] {
    return Array.from({ length: 20 }, (_, i) => recipe[`strIngredient${i + 1}`])
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
}

function pantryFoods(names: string[], expiresInDays = 60) {
    return names.map((name) => ({
        name,
        quantity: 1,
        expirationDate: isoIn(expiresInDays),
    }));
}

type Ranker = (pantry: string[]) => string[];

function overlapScores(pantry: string[]) {
    const translated = new Set(pantry.map((n) => translateIngredient(n) ?? n));
    return benchmarkCatalog
        .map((recipe) => {
            const all = ingredientsOf(recipe);
            return {
                id: String(recipe.idMeal),
                matched: all.filter((i) => translated.has(i)).length,
                total: all.length,
            };
        })
        .filter((entry) => entry.matched > 0);
}

const rankers: Record<string, Ranker> = {
    "Baseline: contagem de ingredientes em comum": (pantry) =>
        overlapScores(pantry)
            .sort((a, b) => b.matched - a.matched || Number(a.id) - Number(b.id))
            .map((e) => e.id),
    "Baseline: cobertura da receita (fração)": (pantry) =>
        overlapScores(pantry)
            .sort(
                (a, b) =>
                    b.matched / b.total - a.matched / a.total ||
                    b.matched - a.matched ||
                    Number(a.id) - Number(b.id),
            )
            .map((e) => e.id),
    "TF-IDF + k-NN sem exigir ingrediente casado": (pantry) =>
        rankRecipesWithML(pantryFoods(pantry), benchmarkCatalog, 18, {
            requireMatchedIngredient: false,
        }).map((r) => r.idMeal),
    "TF-IDF + k-NN (versão do projeto)": (pantry) =>
        rankRecipesWithML(pantryFoods(pantry), benchmarkCatalog, 18).map(
            (r) => r.idMeal,
        ),
};

const gain = (grade: number) => 2 ** grade - 1;
function dcg(grades: number[]): number {
    return grades.reduce((sum, g, i) => sum + gain(g) / Math.log2(i + 2), 0);
}

function evaluate(ranker: Ranker, queries: BenchmarkQuery[]) {
    let precisionAt1 = 0;
    let mrrAt3 = 0;
    let ndcgAt3 = 0;
    for (const query of queries) {
        const top3 = ranker(query.pantry).slice(0, 3);
        const grade = (id: string) => query.grades[id] ?? 0;
        if (top3[0] && grade(top3[0]) > 0) precisionAt1++;
        const first = top3.findIndex((id) => grade(id) > 0);
        if (first >= 0) mrrAt3 += 1 / (first + 1);
        const ideal = Object.values(query.grades)
            .sort((a, b) => b - a)
            .slice(0, 3);
        ndcgAt3 += dcg(top3.map(grade)) / dcg(ideal);
    }
    const n = queries.length;
    return {
        precisionAt1: precisionAt1 / n,
        mrrAt3: mrrAt3 / n,
        ndcgAt3: ndcgAt3 / n,
    };
}

test("Comparação com baselines (relevância graduada, catálogo sintético)", () => {
    const rows: Record<string, ReturnType<typeof evaluate>> = {};
    for (const [name, ranker] of Object.entries(rankers)) {
        rows[name] = evaluate(ranker, benchmarkQueries);
        const r = rows[name];
        console.log(
            `${name.padEnd(46)} P@1=${r.precisionAt1.toFixed(2)}  MRR@3=${r.mrrAt3.toFixed(2)}  nDCG@3=${r.ndcgAt3.toFixed(3)}`,
        );
    }
    console.log(
        `(${benchmarkCatalog.length} receitas, ${benchmarkQueries.length} consultas; amostra pequena, sem teste de significância)`,
    );
    // Piso de sanidade, não uma alegação de superioridade.
    const ours = rows["TF-IDF + k-NN (versão do projeto)"];
    assert.ok(ours.precisionAt1 >= 0.9);
    assert.ok(ours.ndcgAt3 >= 0.9);
});

test("Palavra genérica compartilhada não gera recomendação sem ingrediente casado", () => {
    const pantry = ["frango", "azeite"];
    const withRule = rankRecipesWithML(
        pantryFoods(pantry),
        benchmarkCatalog,
        18,
    );
    const withoutRule = rankRecipesWithML(
        pantryFoods(pantry),
        benchmarkCatalog,
        18,
        { requireMatchedIngredient: false },
    );

    assert.ok(
        withoutRule.some((r) => r.matchingIngredients === 0),
        "sem a regra, 'Sesame Oil' casa com 'Olive Oil' pelo token 'oil'",
    );
    assert.ok(
        withRule.every((r) => r.matchingIngredients > 0),
        "com a regra, toda recomendação tem ao menos um ingrediente do estoque",
    );
    assert.ok(!withRule.some((r) => r.idMeal === "3"));
});

test("Ponderação por validade aproxima receitas do ingrediente que vence primeiro", () => {
    const pantry = [
        "frango", "arroz", "tomate", "ovos", "queijo", "leite", "banana",
        "açúcar", "manteiga", "farinha", "cebola", "alho", "batata", "azeite",
        "macarrão",
    ];
    let withUrgency = 0;
    let withoutUrgency = 0;

    for (const urgent of pantry) {
        const english = translateIngredient(urgent)!;
        const contains = (idMeal: string) =>
            ingredientsOf(
                benchmarkCatalog.find((r) => r.idMeal === idMeal)!,
            ).includes(english);

        const urgentPantry = pantry.map((name) => ({
            name,
            quantity: 1,
            expirationDate: isoIn(name === urgent ? 2 : 60),
        }));
        const [topUrgent] = rankRecipesWithML(urgentPantry, benchmarkCatalog, 1);
        const [topNeutral] = rankRecipesWithML(
            pantryFoods(pantry),
            benchmarkCatalog,
            1,
        );
        if (topUrgent && contains(topUrgent.idMeal)) withUrgency++;
        if (topNeutral && contains(topNeutral.idMeal)) withoutUrgency++;
    }

    console.log(
        `Ingrediente prestes a vencer presente na 1ª recomendação: ${withUrgency}/${pantry.length} com ponderação vs ${withoutUrgency}/${pantry.length} sem`,
    );
    assert.ok(withUrgency > withoutUrgency);
    assert.ok(withUrgency / pantry.length >= 0.6);
});

test("Dicionário cobre ingredientes comuns antes ausentes", () => {
    const expected: Array<[string, string]> = [
        ["cogumelos", "mushrooms"],
        ["aipo", "celery"],
        ["caldo de galinha", "chicken stock"],
        ["caldo de carne", "beef stock"],
        ["óleo de gergelim", "sesame oil"],
    ];
    for (const [pt, en] of expected)
        assert.equal(translateIngredient(pt), en, pt);
});
