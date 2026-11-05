import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ChatController } from "../controllers/chat.controller";

const router = Router();
const controller = new ChatController();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: Assistente IntelliFit integrado à OpenAI API e às funções do backend
 */

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Buscar o histórico da conversa do usuário autenticado
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico de mensagens do chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                     enum: [user, assistant]
 *                   content:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Token de autenticação inválido ou ausente
 */
router.get("/history", controller.history);

/**
 * @swagger
 * /api/chat/history:
 *   delete:
 *     summary: Limpar o histórico da conversa
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     description: Remove as mensagens salvas e cancela qualquer alteração pendente. Não apaga alimentos.
 *     responses:
 *       204:
 *         description: Histórico apagado com sucesso
 *       401:
 *         description: Token de autenticação inválido ou ausente
 */
router.delete("/history", controller.clear);

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Enviar uma mensagem ao Assistente IntelliFit
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     description: A OpenAI API interpreta a mensagem e pode acionar funções controladas do backend. Operações que alteram o estoque exigem confirmação antes de serem persistidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Comprei 2 L de leite para a geladeira, validade 10/12/2026
 *     responses:
 *       200:
 *         description: Resposta do chatbot e estado da operação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                 changed:
 *                   type: boolean
 *                   description: Indica se uma alteração confirmada foi aplicada ao estoque
 *                 pending:
 *                   type: boolean
 *                   description: Indica se existe uma proposta ou escolha aguardando resposta
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [Confirmar, Cancelar]
 *                 provider:
 *                   type: string
 *                   example: OpenAI API + backend IntelliFit
 *       400:
 *         description: Mensagem inválida
 *       401:
 *         description: Token de autenticação inválido ou ausente
 *       500:
 *         description: Erro interno ou falha na comunicação com a OpenAI API
 */
router.post("/", controller.send);

/**
 * @swagger
 * /api/chat/pending/{decision}:
 *   post:
 *     summary: Confirmar ou cancelar uma proposta sem chamar a OpenAI
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: decision
 *         required: true
 *         schema:
 *           type: string
 *           enum: [confirm, cancel]
 *     responses:
 *       200:
 *         description: Resposta do chat com estado e ações disponíveis
 *       400:
 *         description: Decisão inválida
 *       401:
 *         description: Token inválido ou ausente
 */
router.post("/pending/:decision", controller.decide);

export default router;
