import type { CreateFood } from "../interfaces/create-food.interface";
import type { BatchConsumptionOperation } from "./chat.stock";

export type CreateFoodDraftData = {
    name?: string;
    quantity?: number;
    unit?: string;
    storageLocation?: string;
    expirationDate?: string;
    // O usuário citou embalagem (ex.: "8 caixas"): quantidade e unidade
    // precisam ser informadas de novo em uma unidade padronizada.
    packaging?: boolean;
};

export type PendingAction =
    | {
          type: "update_expiration_draft";
          foodId: number;
          foodName: string;
          args: Record<string, unknown>;
      }
    | { type: "delete_food_choice"; foodIds: number[] }
    | {
          type: "create_food_draft";
          data: CreateFoodDraftData;
      }
    | {
          type: "create_food_duplicate_choice";
          incoming: CreateFood;
          existing: CreateFood & { id: number };
      }
    | {
          type: "batch_consume";
          movement?: "consume" | "discard";
          description: string;
          foodName: string;
          operations: BatchConsumptionOperation[];
      }
    | {
          type: "create_food";
          description: string;
          data: CreateFood;
      }
    | {
          type: "update_food";
          description: string;
          foodId: number;
          data: CreateFood;
      }
    | {
          type: "delete_food";
          description: string;
          foodId: number;
      };

export type RecipeContextItem = {
    idMeal: string;
    name: string;
    originalName: string;
};

export type ToolResult = {
    output: Record<string, unknown>;
    pending?: PendingAction;
    directReply?: string;
    directActions?: string[];
};

export type ChatResponse = {
    reply: string;
    changed: boolean;
    pending: boolean;
    actions: string[];
    provider: string;
};
