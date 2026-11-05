import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../src/middlewares/auth.middleware";
import { ChatController } from "../src/controllers/chat.controller";
import { createChatService } from "../src/chat/chat.service";
import { swaggerSpec } from "../src/config/swagger";

test("Controlador rejeita mensagem e decisão inválidas antes de chamar o serviço", async () => {
    const controller = new ChatController(
        createChatService({
            languageModel: async () => {
                throw new Error("Não deve chamar o modelo");
            },
        }),
    );
    let status = 200;
    const response = {
        status(code: number) {
            status = code;
            return this;
        },
        json() {},
    } as unknown as Response;
    const next: NextFunction = (error) => {
        if (error) throw error;
    };
    await controller.send(
        { userId: 1, body: { message: 123 } } as AuthRequest,
        response,
        next,
    );
    assert.equal(status, 400);
    await controller.decide(
        {
            userId: 1,
            params: { decision: "invalid" },
        } as unknown as AuthRequest,
        response,
        next,
    );
    assert.equal(status, 400);
});

test("Swagger documenta todas as rotas do chat e exige JWT", () => {
    const spec = swaggerSpec as {
        paths: Record<string, Record<string, { security?: unknown[] }>>;
    };
    for (const [path, method] of [
        ["/api/chat", "post"],
        ["/api/chat/history", "get"],
        ["/api/chat/history", "delete"],
        ["/api/chat/pending/{decision}", "post"],
    ]) {
        assert.ok(
            spec.paths[path]?.[method]?.security?.length,
            `${method} ${path}`,
        );
    }
});
