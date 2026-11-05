import { Router } from "express";
import { RecipeController } from "../controllers/recipe.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

const recipeController = new RecipeController();

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Sugestões e consulta de receitas
 */

/**
 * @swagger
 * /api/recipes/suggestions:
 *   get:
 *     summary: Buscar receitas sugeridas
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de receitas sugeridas com base nos alimentos do usuário
 *       503:
 *         description: Serviço externo de receitas temporariamente indisponível
 *       401:
 *         description: Token de autenticação inválido ou ausente
 */
router.get(
    "/suggestions",
    authMiddleware,
    recipeController.getSuggestedRecipes
);

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Buscar uma receita pelo ID
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da receita no TheMealDB
 *     responses:
 *       200:
 *         description: Detalhes da receita
 *       400:
 *         description: ID da receita inválido
 *       503:
 *         description: Serviço externo de receitas temporariamente indisponível
 *       401:
 *         description: Token de autenticação inválido ou ausente
 *       404:
 *         description: Receita não encontrada
 */
router.get(
    "/:id",
    authMiddleware,
    recipeController.getRecipeById
);

export default router;