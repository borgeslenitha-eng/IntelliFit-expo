import { Router } from "express";
import { FoodController } from "../controllers/food.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateIdMiddleware } from "../middlewares/validate-id.middleware";

const router = Router();

const foodController = new FoodController();

/**
 * @swagger
 * tags:
 *   name: Foods
 *   description: Gerenciamento dos alimentos do usuário
 */

/**
 * @swagger
 * /api/foods:
 *   get:
 *     summary: Listar alimentos do usuário autenticado
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alimentos
 *       401:
 *         description: Token não informado ou inválido
 */
router.get(
    "/",
    authMiddleware,
    foodController.getAllFoods
);

/**
 * @swagger
 * /api/foods/expiring:
 *   get:
 *     summary: Listar alimentos próximos do vencimento
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alimentos próximos do vencimento
 *       401:
 *         description: Token não informado ou inválido
 */
router.get(
    "/expiring",
    authMiddleware,
    foodController.getExpiringFoods
);

/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     summary: Buscar um alimento específico
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Alimento encontrado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não informado ou inválido
 *       404:
 *         description: Alimento não encontrado
 */
router.get(
    "/:id",
    authMiddleware,
    validateIdMiddleware,
    foodController.getFoodById
);

/**
 * @swagger
 * /api/foods:
 *   post:
 *     summary: Cadastrar um novo alimento
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - quantity
 *               - unit
 *               - storageLocation
 *               - expirationDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Leite
 *               category:
 *                 type: string
 *                 example: Laticínios
 *               quantity:
 *                 type: number
 *                 example: 2
 *               unit:
 *                 type: string
 *                 enum: [un, g, kg, ml, L]
 *                 example: L
 *               storageLocation:
 *                 type: string
 *                 example: Geladeira
 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 description: Data de validade entre hoje e até 10 anos no futuro
 *                 example: 2026-11-20
 *     responses:
 *       201:
 *         description: Alimento cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não informado ou inválido
 */
router.post(
    "/",
    authMiddleware,
    foodController.createFood
);

/**
 * @swagger
 * /api/foods/{id}:
 *   put:
 *     summary: Atualizar um alimento
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - quantity
 *               - unit
 *               - storageLocation
 *               - expirationDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Leite
 *               category:
 *                 type: string
 *                 example: Laticínios
 *               quantity:
 *                 type: number
 *                 example: 3
 *               unit:
 *                 type: string
 *                 enum: [un, g, kg, ml, L]
 *                 example: L
 *               storageLocation:
 *                 type: string
 *                 example: Geladeira
 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 description: Nova validade; datas passadas só são preservadas quando já pertenciam ao registro
 *                 example: 2026-11-25
 *     responses:
 *       200:
 *         description: Alimento atualizado com sucesso
 *       400:
 *         description: Dados ou ID inválidos
 *       401:
 *         description: Token não informado ou inválido
 *       404:
 *         description: Alimento não encontrado
 */
router.put(
    "/:id",
    authMiddleware,
    validateIdMiddleware,
    foodController.updateFood
);

/**
 * @swagger
 * /api/foods/{id}:
 *   delete:
 *     summary: Excluir um alimento
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       204:
 *         description: Alimento excluído com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não informado ou inválido
 *       404:
 *         description: Alimento não encontrado
 */
router.delete(
    "/:id",
    authMiddleware,
    validateIdMiddleware,
    foodController.deleteFood
);

export default router;