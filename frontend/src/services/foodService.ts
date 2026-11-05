/* 
   SERVIÇO DE ALIMENTOS

   Centraliza as requisições relacionadas ao gerenciamento
   dos alimentos do usuário.

   Este serviço é responsável pela comunicação entre o
   frontend e os endpoints de alimentos da API.

   Operações disponíveis:
   - Buscar todos os alimentos.
   - Buscar um alimento específico.
   - Cadastrar um alimento.
   - Atualizar um alimento.
   - Excluir um alimento.
   - Buscar alimentos próximos do vencimento.

   As requisições protegidas utilizam o token JWT armazenado
   no navegador para identificar o usuário autenticado.
*/

import API_URL from "./api";

/*
   ESTRUTURA DOS DADOS

   Define o formato dos alimentos recebidos da API.

   A interface Food representa um alimento já cadastrado,
   incluindo seu identificador, usuário responsável, dados
   de armazenamento e data de vencimento.

   CreateFood representa os dados necessários para cadastrar
   ou atualizar um alimento, sem os campos gerados pelo backend,
   como id, userId e createdAt.
*/

export interface Food {
    id: number;
    userId: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    storageLocation: string;
    expirationDate: string;
    createdAt: string;
}

export interface CreateFood {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    storageLocation: string;
    expirationDate: string;
}

/*
   BUSCAR ALIMENTOS

   Consulta a API para obter todos os alimentos cadastrados
   pelo usuário autenticado.

   O token JWT é enviado no cabeçalho da requisição para que
   o backend possa validar a sessão e identificar o usuário.

   Em caso de erro, a mensagem retornada pela API é utilizada
   para informar o problema ao restante da aplicação.
*/

export async function getFoods(): Promise<Food[]> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao buscar alimentos."
        );
    }

    return result;
}

/*
   CADASTRAR ALIMENTO

   Envia os dados de um novo alimento para a API.

   A requisição utiliza o método POST e envia os dados no
   corpo em formato JSON.

   O token JWT é enviado no cabeçalho para que o backend
   identifique o usuário responsável pelo alimento.

   Após o cadastro, a API retorna o alimento criado.
*/

export async function createFood(
    data: CreateFood
): Promise<Food> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify(data)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao cadastrar alimento."
        );
    }

    return result;
}

/*
   ATUALIZAR ALIMENTO

   Atualiza os dados de um alimento já cadastrado na API.

   O ID identifica qual alimento será alterado, enquanto os
   novos dados são enviados no corpo da requisição em JSON.

   O método PUT é utilizado para realizar a atualização e o
   token JWT garante que a operação seja feita dentro do
   contexto do usuário autenticado.

   A API retorna o alimento após a atualização.
*/

export async function updateFood(
    id: number,
    data: CreateFood
): Promise<Food> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods/${id}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify(data)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao atualizar alimento."
        );
    }

    return result;
}

/*
   EXCLUIR ALIMENTO

   Remove um alimento cadastrado na API utilizando seu ID.

   A requisição utiliza o método DELETE e o token JWT é enviado
   para autenticar a operação.

   Como a exclusão não precisa retornar o alimento removido,
   a função não possui valor de retorno em caso de sucesso.

   Caso a API retorne um erro, a mensagem é repassada para
   a aplicação.
*/

export async function deleteFood(
    id: number
): Promise<void> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods/${id}`,
        {
            method: "DELETE",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {

        const result = await response.json();

        throw new Error(
            result.error || "Erro ao excluir alimento."
        );
    }
}

/*
   BUSCAR ALIMENTO POR ID

   Consulta a API para obter um alimento específico.

   O ID do alimento é utilizado para identificar o registro
   que será consultado.

   O token JWT é enviado para autenticar a requisição e
   garantir que a consulta ocorra no contexto do usuário
   autenticado.

   Em caso de sucesso, a função retorna os dados completos
   do alimento.
*/

export async function getFoodById(
    id: number
): Promise<Food> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods/${id}`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao buscar alimento."
        );
    }

    return result;
}

/*
   DADOS DE VALIDADE

   ExpiringFood estende a estrutura Food com informações
   adicionais relacionadas à validade do alimento.

   daysUntilExpiration indica quantos dias faltam para o
   vencimento, enquanto status representa a situação do
   alimento, como normal, próximo do vencimento ou vencido.

   Esses dados são utilizados pelo frontend para exibir
   alertas e informações de validade ao usuário.
*/

export interface ExpiringFood extends Food {
    daysUntilExpiration: number;
    status: string;
}

/*
   BUSCAR ALIMENTOS PRÓXIMOS DO VENCIMENTO

   Consulta a API para obter os alimentos acompanhados
   das informações relacionadas à sua validade.

   O backend é responsável por calcular os dados de
   vencimento e retornar o status de cada alimento.

   O token JWT é enviado para que a API identifique o
   usuário autenticado.

   Esses dados são utilizados principalmente para exibir
   alertas e indicadores de validade no frontend.
*/

export async function getExpiringFoods(): Promise<ExpiringFood[]> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/foods/expiring`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Erro ao buscar alimentos próximos do vencimento."
        );
    }

    return result;
}