/*
   MIDDLEWARE DE AUTENTICAÇÃO

   Responsável por validar o token JWT enviado nas requisições
   que exigem autenticação.

   O middleware verifica se o token foi informado, se está no
   formato esperado e se é válido ou ainda não expirou.

   Quando a autenticação é válida, os dados do usuário são
   adicionados à requisição para que possam ser utilizados
   pelas rotas e serviços.

   Caso o token seja inválido, ausente ou esteja expirado,
   a API retorna um erro de autenticação.
*/

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


/*
   REQUISIÇÃO AUTENTICADA

   Estende o objeto Request padrão do Express para permitir
   armazenar informações do usuário autenticado.

   userId identifica o usuário que realizou a requisição,
   enquanto role representa seu nível de acesso.

   Esses dados são preenchidos pelo middleware após a validação
   do token JWT e podem ser utilizados posteriormente pelas
   rotas e serviços protegidos.
*/

export interface AuthRequest extends Request {
    userId?: number;
    role?: string;
}

/*
   VALIDAÇÃO DO TOKEN JWT

   Intercepta requisições protegidas e verifica se o usuário
   possui um token JWT válido.

   Primeiro, verifica se o token foi enviado no cabeçalho
   Authorization e se está no formato Bearer.

   Em seguida, valida o token utilizando a chave secreta
   definida nas variáveis de ambiente.

   Quando o token é válido, o userId e o role são adicionados
   à requisição e o fluxo segue para a próxima etapa através
   do next().

   Caso a validação falhe, a requisição é interrompida e a API
   retorna um erro de autenticação.
*/

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({
            error: "Token de autenticação não informado."
        });
        return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        res.status(401).json({
            error: "Formato do token inválido."
        });
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as {
            userId: number;
            role: string;
        };

        req.userId = decoded.userId;
        req.role = decoded.role;

        next();
    } catch (error) {
        res.status(401).json({
            error: "Token inválido ou expirado."
        });
    }
};