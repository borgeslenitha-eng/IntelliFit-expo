/*
   CONFIGURAÇÃO DO SWAGGER

   Define as informações utilizadas para gerar a documentação
   da API REST do IntelliFit através do padrão OpenAPI.

   A configuração informa os dados da API, o endereço do servidor
   local e o esquema de autenticação Bearer com JWT.

   O Swagger também procura as definições das rotas dentro dos
   arquivos localizados em src/routes.
*/

import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "IntelliFit API",
            version: "1.0.0",
            description:
                "API REST para gerenciamento de alimentos da plataforma IntelliFit."
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor local"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },

    apis: [
        "./src/routes/*.ts"
    ]
};

/*
   GERAÇÃO DA ESPECIFICAÇÃO

   Utiliza o swagger-jsdoc para transformar as configurações
   e as definições das rotas em uma especificação OpenAPI.

   O swaggerSpec é exportado para ser utilizado pelo servidor
   na disponibilização da documentação interativa da API.
*/

export const swaggerSpec =
    swaggerJSDoc(swaggerOptions);