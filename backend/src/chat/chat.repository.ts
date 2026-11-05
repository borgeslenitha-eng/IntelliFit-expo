import { pool } from "../config/database";
import type { Pool } from "pg";
import type { PendingAction, RecipeContextItem } from "./chat.types";

export function createChatRepository(
    database: Pick<Pool, "query" | "connect"> = pool,
) {
    async function ensureSession(userId: number): Promise<void> {
        await database.query(
            `INSERT INTO chat_sessions(user_id)
             VALUES($1)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId],
        );
    }

    async function getPendingAction(
        userId: number,
    ): Promise<PendingAction | null> {
        await ensureSession(userId);

        const result = await database.query(
            `SELECT pending_action
             FROM chat_sessions
             WHERE user_id=$1`,
            [userId],
        );

        return result.rows[0]?.pending_action ?? null;
    }

    async function setPendingAction(
        userId: number,
        action: PendingAction | null,
    ): Promise<void> {
        await ensureSession(userId);

        await database.query(
            `UPDATE chat_sessions
             SET pending_action=$1, updated_at=NOW()
             WHERE user_id=$2`,
            [action ? JSON.stringify(action) : null, userId],
        );
    }

    async function getRecipeContext(
        userId: number,
    ): Promise<RecipeContextItem[]> {
        await ensureSession(userId);

        const result = await database.query(
            `SELECT recipe_context
             FROM chat_sessions
             WHERE user_id=$1`,
            [userId],
        );

        return Array.isArray(result.rows[0]?.recipe_context)
            ? result.rows[0].recipe_context
            : [];
    }

    async function setRecipeContext(
        userId: number,
        recipes: RecipeContextItem[],
    ): Promise<void> {
        await ensureSession(userId);

        await database.query(
            `UPDATE chat_sessions
             SET recipe_context=$1, updated_at=NOW()
             WHERE user_id=$2`,
            [JSON.stringify(recipes), userId],
        );
    }

    async function saveMessage(
        userId: number,
        role: "user" | "assistant",
        content: string,
    ): Promise<void> {
        await database.query(
            `INSERT INTO chat_messages(user_id, role, content)
             VALUES($1, $2, $3)`,
            [userId, role, content],
        );
    }

    async function recentHistory(userId: number) {
        const result = await database.query(
            `SELECT role, content
             FROM (
                 SELECT id, role, content
                 FROM chat_messages
                 WHERE user_id=$1
                 ORDER BY id DESC
                 LIMIT 12
             ) AS recent
             ORDER BY id ASC`,
            [userId],
        );

        return result.rows.map((row: { role: string; content: string }) => ({
            role: row.role,
            content: row.content,
        }));
    }

    async function getChatHistory(userId: number) {
        const result = await database.query(
            `SELECT role, content, created_at FROM (
                 SELECT id, role, content, created_at FROM chat_messages
                 WHERE user_id=$1 ORDER BY id DESC LIMIT 200
             ) AS recent ORDER BY id ASC`,
            [userId],
        );

        return result.rows;
    }

    async function clearChat(userId: number): Promise<void> {
        await ensureSession(userId);

        const client = await database.connect();

        try {
            await client.query("BEGIN");
            await client.query(
                `DELETE FROM chat_messages
                 WHERE user_id=$1`,
                [userId],
            );
            await client.query(
                `UPDATE chat_sessions
                 SET pending_action=NULL, recipe_context=NULL, updated_at=NOW()
                 WHERE user_id=$1`,
                [userId],
            );
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async function lastAssistantMessage(userId: number): Promise<string> {
        const result = await database.query(
            `SELECT content
             FROM chat_messages
             WHERE user_id=$1 AND role='assistant'
             ORDER BY id DESC
             LIMIT 1`,
            [userId],
        );

        return String(result.rows[0]?.content ?? "");
    }

    return {
        getPendingAction,
        setPendingAction,
        getRecipeContext,
        setRecipeContext,
        saveMessage,
        recentHistory,
        getChatHistory,
        clearChat,
        lastAssistantMessage,
    };
}

export type ChatRepository = ReturnType<typeof createChatRepository>;
