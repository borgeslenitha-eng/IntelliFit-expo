import app from "./app";
import { pool } from "./config/database";

const PORT = 3000;

pool.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL conectado com sucesso!");

        app.listen(PORT, () => {
            console.log(`IntelliFit API rodando em http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Erro ao conectar ao PostgreSQL:", error);
    });