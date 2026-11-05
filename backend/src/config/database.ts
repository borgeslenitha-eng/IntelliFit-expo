/*
   CONEXÃO COM O BANCO DE DADOS

   Cria um Pool de conexões utilizando o PostgreSQL.

   As informações de conexão são obtidas das variáveis de
   ambiente para evitar que credenciais e configurações do
   banco sejam diretamente expostas no código.

   O Pool permite que a aplicação reutilize conexões com o
   banco de dados, sendo utilizado pelos repositories para
   executar as operações de persistência.
*/

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});