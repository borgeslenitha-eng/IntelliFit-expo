import { pool } from "../config/database";
import { Food } from "../interfaces/food.interface";
import { CreateFoodData } from "../interfaces/create-food-data.interface";
import { CreateFood } from "../interfaces/create-food.interface";

export class FoodRepository {
    public async findAllByUserId(userId: number): Promise<Food[]> {
        const result = await pool.query(
            `
            SELECT
                id,
                user_id AS "userId",
                name,
                category,
                quantity::float AS quantity,
                unit,
                storage_location AS "storageLocation",
                expiration_date AS "expirationDate",
                created_at AS "createdAt"
            FROM foods
            WHERE user_id = $1
            ORDER BY expiration_date ASC
            `,
            [userId],
        );

        return result.rows;
    }

    public async findById(id: number, userId: number): Promise<Food | null> {
        const result = await pool.query(
            `
            SELECT
                id,
                user_id AS "userId",
                name,
                category,
                quantity::float AS quantity,
                unit,
                storage_location AS "storageLocation",
                expiration_date AS "expirationDate",
                created_at AS "createdAt"
            FROM foods
            WHERE id = $1
              AND user_id = $2
            `,
            [id, userId],
        );

        return result.rows[0] ?? null;
    }

    public async create(food: CreateFoodData): Promise<Food> {
        const result = await pool.query(
            `
            INSERT INTO foods (
                user_id,
                name,
                category,
                quantity,
                unit,
                storage_location,
                expiration_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                user_id AS "userId",
                name,
                category,
                quantity::float AS quantity,
                unit,
                storage_location AS "storageLocation",
                expiration_date AS "expirationDate",
                created_at AS "createdAt"
            `,
            [
                food.userId,
                food.name,
                food.category,
                food.quantity,
                food.unit,
                food.storageLocation,
                food.expirationDate,
            ],
        );

        return result.rows[0];
    }

    public async update(
        id: number,
        userId: number,
        food: CreateFood,
    ): Promise<Food | null> {
        const result = await pool.query(
            `
            UPDATE foods
            SET
                name = $1,
                category = $2,
                quantity = $3,
                unit = $4,
                storage_location = $5,
                expiration_date = $6
            WHERE id = $7
              AND user_id = $8
            RETURNING
                id,
                user_id AS "userId",
                name,
                category,
                quantity::float AS quantity,
                unit,
                storage_location AS "storageLocation",
                expiration_date AS "expirationDate",
                created_at AS "createdAt"
            `,
            [
                food.name,
                food.category,
                food.quantity,
                food.unit,
                food.storageLocation,
                food.expirationDate,
                id,
                userId,
            ],
        );

        return result.rows[0] ?? null;
    }

    public async delete(id: number, userId: number): Promise<boolean> {
        const result = await pool.query(
            `
            DELETE FROM foods
            WHERE id = $1
              AND user_id = $2
            `,
            [id, userId],
        );

        return result.rowCount !== null && result.rowCount > 0;
    }

    public async findExpiringByUserId(userId: number): Promise<Food[]> {
        const result = await pool.query(
            `
            SELECT
                id,
                user_id AS "userId",
                name,
                category,
                quantity::float AS quantity,
                unit,
                storage_location AS "storageLocation",
                expiration_date AS "expirationDate",
                created_at AS "createdAt"
            FROM foods
            WHERE user_id = $1
              AND expiration_date <= CURRENT_DATE + INTERVAL '7 days'
            ORDER BY expiration_date ASC
            `,
            [userId],
        );

        return result.rows;
    }
    public async applyBatchConsumption(
        userId: number,
        operations: Array<{ foodId: number; newQuantity: number | null }>,
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const operation of operations) {
                const result =
                    operation.newQuantity === null
                        ? await client.query(
                              "DELETE FROM foods WHERE id=$1 AND user_id=$2",
                              [operation.foodId, userId],
                          )
                        : await client.query(
                              "UPDATE foods SET quantity=$1 WHERE id=$2 AND user_id=$3",
                              [operation.newQuantity, operation.foodId, userId],
                          );
                if (result.rowCount !== 1)
                    throw new Error(
                        "O estoque mudou. Solicite novamente o consumo.",
                    );
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
