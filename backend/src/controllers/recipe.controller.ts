import { Response, NextFunction } from "express";
import { RecipeService } from "../services/recipe.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { FoodRepository } from "../repositories/food.repository";

export class RecipeController {
    private recipeService: RecipeService;
    private foodRepository: FoodRepository;

    constructor() {
        this.recipeService = new RecipeService();
        this.foodRepository = new FoodRepository();
    }

    public getSuggestedRecipes = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.userId) {
                throw new Error("Usuário não autenticado.");
            }

            const foods = await this.foodRepository.findAllByUserId(
                req.userId
            );

            const recommendations =
                await this.recipeService.getRecommendations(foods);

            res.json(recommendations);
        } catch (error) {
            next(error);
        }
    };

    public getRecipeById = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.userId) {
                throw new Error("Usuário não autenticado.");
            }

            const { id } = req.params;

            if (typeof id !== "string") {
                res.status(400).json({
                    error: "ID da receita inválido."
                });
                return;
            }

            const recipe =
                await this.recipeService.getLocalizedById(id);

            if (!recipe) {
                res.status(404).json({
                    error: "Receita não encontrada."
                });
                return;
            }

            res.json(recipe);
        } catch (error) {
            next(error);
        }
    };
}
