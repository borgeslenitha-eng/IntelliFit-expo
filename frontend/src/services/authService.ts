/*
   SERVIÇO DE AUTENTICAÇÃO

   Centraliza as requisições relacionadas à autenticação e
   ao gerenciamento dos dados do usuário.

   - login: autentica um usuário e recebe seu token JWT.
   - register: cadastra um novo usuário.
   - getCurrentUser: consulta os dados do usuário autenticado.

   Este serviço é responsável pela comunicação entre o
   frontend e os endpoints de autenticação da API.

   As páginas e componentes utilizam essas funções para
   realizar as operações de autenticação sem precisar
   implementar diretamente as requisições HTTP.
*/

import API_URL from "./api";

interface LoginData {
    email: string;
    password: string;
}

interface LoginResponse {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    token: string;
}

/* 
   Realiza a autenticação do usuário através da API.

   Envia o e-mail e a senha para o endpoint de login e,
   em caso de sucesso, retorna os dados do usuário junto
   com o token JWT utilizado nas requisições autenticadas.

   Em caso de erro, utiliza a mensagem retornada pela API
   para informar o problema ao componente que realizou
   a chamada.
*/

export async function login(
    data: LoginData
): Promise<LoginResponse> {

    const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Erro ao realizar login."
        );
    }

    return result;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

/* 
   Realiza o cadastro de um novo usuário através da API.

   Envia nome, e-mail e senha para o endpoint de cadastro
   e retorna a resposta da API após a criação do usuário.

   Caso o cadastro não seja realizado, lança um erro com
   a mensagem retornada pelo backend.
*/

export async function register(
    data: RegisterData
) {

    const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Erro ao realizar cadastro."
        );
    }

    return result;
}

export interface CurrentUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

/* 
   Busca os dados do usuário atualmente autenticado.

   Recupera o token JWT armazenado no navegador e o envia
   no cabeçalho Authorization para o endpoint /me da API.

   Em caso de sucesso, retorna os dados do usuário.
   Caso o token seja inválido ou ocorra outro erro na API,
   lança um erro para ser tratado pelo componente que
   realizou a chamada.
*/

export async function getCurrentUser(): Promise<CurrentUser> {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/api/auth/me`,
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
            "Erro ao buscar dados do usuário."
        );
    }

    return result;
}