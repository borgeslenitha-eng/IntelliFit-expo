import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getSuggestedRecipes,
    type Recipe
} from "../services/recipeService";

function Recipes() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecipes = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setRecipes(await getSuggestedRecipes());
        } catch (error) {
            setError(error instanceof Error ? error.message : "Não foi possível carregar as receitas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadRecipes(); }, [loadRecipes]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Receitas</h1>
                    <p className="page-description">
                        Sugestões com base nos alimentos disponíveis
                        no seu estoque.
                    </p>
                </div>
            </div>

            {loading && <p>Buscando receitas e calculando recomendações...</p>}

            {error && (
                <div role="alert">
                    <p className="form-error">{error}</p>
                    <button type="button" className="button-primary" onClick={() => void loadRecipes()} disabled={loading}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {!loading && !error && recipes.length === 0 && (
                <div className="empty-state">
                    <h2>Nenhuma receita encontrada</h2>
                    <p>
                        Cadastre mais alimentos para receber
                        recomendações.
                    </p>
                </div>
            )}

            {!loading && !error && recipes.length > 0 && (
                <div className="recipe-grid">
                    {recipes.map((recipe) => (
                        <div
                            className="recipe-card"
                            key={recipe.idMeal}
                        >
                            <img
                                src={recipe.strMealThumb}
                                alt={recipe.strMeal}
                                className="recipe-image"
                            />

                            <div className="recipe-content">
                                <h2>{recipe.strMeal}</h2>
                                <p>{recipe.strCategory}</p>

                                <p>
                                    <strong>
                                        {recipe.matchingIngredients}
                                    </strong>{" "}
                                    alimento(s) do seu estoque combinam
                                    com esta receita.
                                </p>

                                {recipe.matchedIngredients &&
                                    recipe.matchedIngredients.length > 0 && (
                                        <p className="recipe-matches">
                                            Usa do seu estoque:{" "}
                                            {recipe.matchedIngredients
                                                .slice(0, 4)
                                                .join(", ")}
                                        </p>
                                    )}

                                <button
                                    className="button-primary"
                                    onClick={() =>
                                        navigate(
                                            `/recipes/${recipe.idMeal}`
                                        )
                                    }
                                >
                                    Ver receita
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Recipes;
