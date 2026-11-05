import assert from "node:assert/strict";
import test from "node:test";
import { rankRecipesWithML } from "../src/ml/recipe-recommender";
import { todayInBrazilIso } from "../src/utils/expiration";
import { catalog, queries } from "./fixtures/recipe-catalog";

test("Avaliação didática reproduzível: Precision@1 e MRR@3 em consultas sintéticas", () => {
    let firstHits = 0;
    let reciprocalRanks = 0;
    for (const query of queries) {
        const foods = query.pantry.map((name) => ({
            name,
            quantity: 1,
            expirationDate: todayInBrazilIso(),
        }));
        const ranking = rankRecipesWithML(foods, catalog, 3);
        const rank = ranking.findIndex((recipe) =>
            query.relevant.includes(recipe.idMeal),
        );
        if (rank === 0) firstHits++;
        if (rank >= 0) reciprocalRanks += 1 / (rank + 1);
        console.log(
            `${query.pantry.join(", ")} → ${ranking.map((recipe) => recipe.idMeal).join(", ")}`,
        );
    }
    const precisionAt1 = firstHits / queries.length;
    const mrrAt3 = reciprocalRanks / queries.length;
    console.log(
        JSON.stringify({
            corpus: "sintético",
            recipes: catalog.length,
            queries: queries.length,
            precisionAt1,
            mrrAt3,
        }),
    );
    // São controles didáticos, sem estimativa de desempenho em usuários reais.
    assert.equal(precisionAt1, 1);
    assert.equal(mrrAt3, 1);
});
