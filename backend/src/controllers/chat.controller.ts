import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import chatService, { type createChatService } from "../chat/chat.service";

type ChatService = ReturnType<typeof createChatService>;

/** Adaptador HTTP: autenticação, entrada e saída; regras ficam no serviço. */
export class ChatController {
    constructor(private readonly service: ChatService = chatService) {}

    public history = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.userId) throw new Error("Usuário não autenticado.");
            res.json(await this.service.getChatHistory(req.userId));
        } catch (error) {
            next(error);
        }
    };

    public clear = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.userId) throw new Error("Usuário não autenticado.");
            await this.service.clearChat(req.userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    public send = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.userId) throw new Error("Usuário não autenticado.");
            if (typeof req.body?.message !== "string") {
                res.status(400).json({ error: "Envie a mensagem do chatbot." });
                return;
            }
            res.json(
                await this.service.sendChatMessage(
                    req.userId,
                    req.body.message,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    public decide = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.userId) throw new Error("Usuário não autenticado.");
            const decision = req.params.decision;
            if (decision !== "confirm" && decision !== "cancel") {
                res.status(400).json({
                    error: "Decisão inválida. Use confirm ou cancel.",
                });
                return;
            }
            res.json(
                await this.service.resolvePendingAction(req.userId, decision),
            );
        } catch (error) {
            next(error);
        }
    };
}
