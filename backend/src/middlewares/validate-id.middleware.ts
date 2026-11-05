import { Request, Response, NextFunction } from "express";

export const validateIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
            error: "ID inválido."
        });
        return;
    }

    next();
};