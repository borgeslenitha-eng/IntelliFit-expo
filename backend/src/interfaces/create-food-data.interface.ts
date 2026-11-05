import { CreateFood } from "./create-food.interface";

export interface CreateFoodData extends CreateFood {
    userId: number;
}