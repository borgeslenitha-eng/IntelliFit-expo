/** Corpus sintético e pequeno para validação didática. Não é uma amostra da TheMealDB. */
function recipe(
    id: string,
    name: string,
    ingredients: string[],
): Record<string, unknown> {
    return Object.fromEntries([
        ["idMeal", id],
        ["strMeal", name],
        ["strMealThumb", ""],
        ["strInstructions", ""],
        ["strCategory", "Fixture"],
        ["strArea", "Fixture"],
        ...ingredients.map((ingredient, i) => [
            `strIngredient${i + 1}`,
            ingredient,
        ]),
    ]);
}

export const catalog = [
    recipe("1", "Frango com arroz", ["Chicken", "Rice", "Tomato"]),
    recipe("2", "Omelete", ["Egg", "Cheese", "Salt"]),
    recipe("3", "Torta de maçã", ["Apple", "Flour", "Sugar"]),
    recipe("4", "Arroz com cogumelos", ["Rice", "Mushrooms", "Onion"]),
    recipe("5", "Batata com queijo", ["Potato", "Cheese", "Butter"]),
    recipe("6", "Macarrão ao tomate", ["Pasta", "Tomato", "Garlic"]),
    recipe("7", "Macarrão com atum", ["Tuna", "Pasta", "Onion"]),
    recipe("8", "Vitamina de banana", ["Banana", "Milk", "Sugar"]),
];

// Relevância definida manualmente antes da execução do ranking.
export const queries = [
    { pantry: ["frango", "arroz", "tomate"], relevant: ["1"] },
    { pantry: ["ovos", "queijo"], relevant: ["2"] },
    { pantry: ["maçã", "farinha"], relevant: ["3"] },
    { pantry: ["arroz", "cogumelo", "cebola"], relevant: ["4"] },
    { pantry: ["batata", "queijo", "manteiga"], relevant: ["5"] },
    { pantry: ["macarrão", "tomate", "alho"], relevant: ["6"] },
    { pantry: ["atum", "macarrão", "cebola"], relevant: ["7"] },
    { pantry: ["banana", "leite"], relevant: ["8"] },
];
