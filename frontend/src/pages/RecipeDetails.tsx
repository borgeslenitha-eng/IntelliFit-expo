import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getRecipeById,
    type Recipe
} from "../services/recipeService";

function RecipeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadRecipe() {
            if (!id) {
                setError("ID da receita não informado.");
                setLoading(false);
                return;
            }

            try {
                const result = await getRecipeById(id);
                setRecipe(result);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Erro ao carregar receita."
                );
            } finally {
                setLoading(false);
            }
        }

        void loadRecipe();
    }, [id]);

    if (loading) {
        return (
            <div className="page-container">
                <p>Carregando e traduzindo receita...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <p className="form-error">{error}</p>
                <button
                    className="button-secondary"
                    onClick={() => navigate("/recipes")}
                >
                    Voltar para receitas
                </button>
            </div>
        );
    }

    if (!recipe) {
        return null;
    }

    const ingredients = recipe.localizedIngredients ?? [];
    const steps = recipe.preparationSteps ?? [];
    const translated = recipe.localizationLanguage === "pt-BR";

    return (
        <div className="page-container">
            <button
                className="button-secondary"
                onClick={() => navigate("/recipes")}
            >
                ← Voltar para receitas
            </button>

            <div className="recipe-details">
                <img
                    src={recipe.strMealThumb}
                    alt={recipe.strMeal}
                    className="recipe-details-image"
                />

                <div className="recipe-details-content">
                    <h1>{translated ? recipe.strMeal : "Receita"}</h1>

                    {!translated ? (
                        <p className="form-error">
                            Não foi possível carregar a versão em português desta receita. Tente novamente em alguns instantes.
                        </p>
                    ) : (
                        <>
                            <p>
                                <strong>Categoria:</strong>{" "}
                                {recipe.strCategory}
                            </p>

                            <p>
                                <strong>Origem:</strong>{" "}
                                {recipe.strArea}
                            </p>

                            <h2>Ingredientes</h2>
                            {ingredients.length > 0 ? (
                                <ul className="recipe-ingredients-list">
                                    {ingredients.map((ingredient, index) => (
                                        <li key={`${ingredient.name}-${index}`}>
                                            {ingredient.measure && (
                                                <strong>
                                                    {ingredient.measure}{" "}
                                                </strong>
                                            )}
                                            {ingredient.name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Ingredientes não disponíveis.</p>
                            )}

                            <h2>Modo de preparo</h2>

                            {steps.length > 0 ? (
                                <ol className="recipe-steps-list">
                                    {steps.map((step, index) => (
                                        <li key={`${index}-${step.slice(0, 20)}`}>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p>Modo de preparo não disponível.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecipeDetails;
