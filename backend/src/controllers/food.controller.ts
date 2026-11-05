import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { FoodService } from "../services/food.service";

export class FoodController {

    private foodService: FoodService;

    constructor() {
        this.foodService = new FoodService();
    }

    public getAllFoods = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const foods =
                await this.foodService.getAllFoods(
                    req.userId
                );

            res.json(foods);

        } catch (error) {
            next(error);
        }
    };

    public getFoodById = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const id = Number(req.params.id);

            const food =
                await this.foodService.getFoodById(
                    id,
                    req.userId
                );

            res.json(food);

        } catch (error) {
            next(error);
        }
    };

    public createFood = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const food =
                await this.foodService.createFood(
                    req.userId,
                    req.body
                );

            res.status(201).json(food);

        } catch (error) {
            next(error);
        }
    };

    public updateFood = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const id = Number(req.params.id);

            const food =
                await this.foodService.updateFood(
                    id,
                    req.userId,
                    req.body
                );

            res.json(food);

        } catch (error) {
            next(error);
        }
    };

    public deleteFood = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const id = Number(req.params.id);

            await this.foodService.deleteFood(
                id,
                req.userId
            );

            res.status(204).send();

        } catch (error) {
            next(error);
        }
    };

    public getExpiringFoods = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            if (!req.userId) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const foods =
                await this.foodService.getExpiringFoods(
                    req.userId
                );

            res.json(foods);

        } catch (error) {
            next(error);
        }
    };
}