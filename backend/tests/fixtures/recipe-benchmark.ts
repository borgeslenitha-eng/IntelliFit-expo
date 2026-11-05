/**
 * Benchmark sintético, MAIOR e MAIS DIFÍCIL que `recipe-catalog.ts`.
 *
 * Características intencionais:
 *  - receitas que compartilham palavras genéricas ("oil", "stock") com o estoque;
 *  - consultas com 2 a 6 ingredientes e várias receitas parcialmente adequadas;
 *  - relevância GRADUADA escrita à mão (2 = dá para cozinhar quase tudo com a
 *    despensa; 1 = adequação parcial plausível; ausente = irrelevante), definida
 *    por julgamento e NÃO calculada pela fórmula de nenhum ranker.
 *
 * Limitações: 18 receitas e 15 consultas escritas pelos autores; serve para
 * comparar métodos e detectar regressões, não para estimar desempenho real.
 */
function recipe(id: string, name: string, ingredients: string[]) {
    return Object.fromEntries([
        ["idMeal", id],
        ["strMeal", name],
        ["strMealThumb", ""],
        ["strInstructions", ""],
        ["strCategory", "Benchmark"],
        ["strArea", "Benchmark"],
        ...ingredients.map((x, i) => [`strIngredient${i + 1}`, x]),
    ]) as Record<string, unknown>;
}

export const benchmarkCatalog = [
    recipe("1", "Roast Chicken", ["Chicken", "Garlic", "Onion", "Salt", "Olive Oil"]),
    recipe("2", "Chicken Rice", ["Chicken", "Rice", "Tomato"]),
    recipe("3", "Sesame Noodles", ["Sesame Oil", "Soy Sauce", "Noodles"]),
    recipe("4", "Chicken Stock Soup", ["Chicken Stock", "Carrots", "Celery"]),
    recipe("5", "Omelette", ["Egg", "Cheese", "Salt", "Butter"]),
    recipe("6", "Egg Fried Rice", ["Egg", "Rice", "Soy Sauce", "Onion", "Sesame Oil"]),
    recipe("7", "Apple Pie", ["Apple", "Flour", "Sugar", "Butter", "Cinnamon"]),
    recipe("8", "Pancakes", ["Flour", "Milk", "Egg", "Sugar", "Butter"]),
    recipe("9", "Banana Smoothie", ["Banana", "Milk", "Sugar"]),
    recipe("10", "Tomato Pasta", ["Pasta", "Tomato", "Garlic", "Olive Oil", "Basil"]),
    recipe("11", "Tuna Pasta", ["Tuna", "Pasta", "Onion", "Olive Oil"]),
    recipe("12", "Mushroom Risotto", ["Rice", "Mushrooms", "Onion", "Butter", "Chicken Stock", "Parmesan"]),
    recipe("13", "Potato Gratin", ["Potato", "Cheese", "Butter", "Milk", "Garlic"]),
    recipe("14", "Beef Stew", ["Beef", "Potato", "Carrots", "Onion", "Beef Stock", "Garlic", "Tomato Puree"]),
    recipe("15", "Eggplant Parmigiana", ["Eggplant", "Tomato", "Cheese", "Olive Oil", "Basil"]),
    recipe("16", "Rice Pudding", ["Rice", "Milk", "Sugar", "Cinnamon"]),
    recipe("17", "Garlic Bread", ["Bread", "Garlic", "Butter", "Parsley"]),
    recipe("18", "Caesar Salad", ["Lettuce", "Chicken", "Parmesan", "Bread", "Olive Oil", "Egg"]),
];

export type BenchmarkQuery = {
    pantry: string[];
    /** idMeal → ganho (2 ou 1). Ausente = 0. */
    grades: Record<string, number>;
    note?: string;
};

export const benchmarkQueries: BenchmarkQuery[] = [
    { pantry: ["frango", "arroz", "tomate"], grades: { "2": 2, "1": 1 } },
    { pantry: ["ovos", "queijo", "manteiga", "sal"], grades: { "5": 2, "8": 1, "13": 1 } },
    { pantry: ["farinha", "leite", "ovos", "açúcar", "manteiga"], grades: { "8": 2, "7": 1, "9": 1 } },
    { pantry: ["macarrão", "tomate", "alho", "azeite", "manjericão"], grades: { "10": 2, "11": 1, "15": 1 } },
    { pantry: ["atum", "macarrão", "cebola", "azeite"], grades: { "11": 2, "10": 1 } },
    { pantry: ["arroz", "cogumelos", "cebola", "manteiga", "caldo de galinha", "parmesão"], grades: { "12": 2 } },
    {
        pantry: ["frango", "azeite"],
        grades: { "1": 1, "18": 1, "2": 1 },
        note: "armadilha: 'Sesame Noodles' (oil) e 'Chicken Stock Soup' (stock) compartilham só uma palavra",
    },
    { pantry: ["batata", "queijo", "manteiga", "leite", "alho"], grades: { "13": 2, "5": 1 } },
    { pantry: ["banana", "leite", "açúcar"], grades: { "9": 2, "8": 1, "16": 1 } },
    { pantry: ["arroz", "leite", "açúcar", "canela"], grades: { "16": 2, "9": 1, "7": 1 } },
    { pantry: ["ovos", "arroz", "molho de soja", "cebola", "óleo de gergelim"], grades: { "6": 2, "3": 1 } },
    { pantry: ["pão", "alho", "manteiga", "salsa"], grades: { "17": 2 } },
    { pantry: ["berinjela", "tomate", "queijo", "azeite", "manjericão"], grades: { "15": 2, "10": 1 } },
    { pantry: ["carne", "batata", "cenoura", "cebola", "caldo de carne", "alho"], grades: { "14": 2, "13": 1 } },
    { pantry: ["alface", "frango", "pão", "parmesão", "ovos", "azeite"], grades: { "18": 2, "1": 1, "2": 1 } },
];
