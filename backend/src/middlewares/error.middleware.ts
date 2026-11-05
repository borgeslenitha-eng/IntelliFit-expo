import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    console.error(error);
    if ("statusCode" in error && error.statusCode === 503) {
        res.status(503).json({ error: error.message });
        return;
    }

    if (error.message === "Alimento não encontrado.") {
        res.status(404).json({
            error: error.message,
        });
        return;
    }

    if (error.message === "E-mail já cadastrado.") {
        res.status(409).json({
            error: error.message,
        });
        return;
    }

    res.status(400).json({
        error: error.message,
    });
};
