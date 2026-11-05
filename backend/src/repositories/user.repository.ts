import { pool } from "../config/database";

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
}

export class UserRepository {

    public async findByEmail(email: string): Promise<User | null> {
        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password,
                role
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        return result.rows[0] ?? null;
    }

    public async findById(
        id: number
    ): Promise<User | null> {

        const result = await pool.query(
            `
        SELECT
            id,
            name,
            email,
            password,
            role
        FROM users
        WHERE id = $1
        `,
            [id]
        );

        return result.rows[0] ?? null;
    }

    public async create(
        name: string,
        email: string,
        password: string
    ): Promise<User> {
        const result = await pool.query(
            `
            INSERT INTO users (
                name,
                email,
                password
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                name,
                email,
                password,
                role
            `,
            [name, email, password]
        );

        return result.rows[0];
    }
}