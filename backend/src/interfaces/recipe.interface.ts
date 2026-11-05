export interface MealSummary {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
}

export interface MealDetails extends MealSummary {
    strInstructions: string;
    strCategory: string;
    strArea: string;
    [key: string]: unknown;
}
