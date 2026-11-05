/*
   CONFIGURAÇÃO DAS ROTAS

   Importa os componentes responsáveis pela navegação da
   aplicação e pelas páginas acessadas através das rotas.

   - BrowserRouter: habilita o sistema de rotas no navegador.
   - Routes: agrupa todas as rotas da aplicação.
   - Route: define o caminho e o componente correspondente.

   Também são importadas as páginas do IntelliFit e os
   componentes responsáveis pela proteção e estrutura das
   páginas autenticadas.
 */

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Foods from "./pages/Foods";
import NewFood from "./pages/NewFood";
import EditFood from "./pages/EditFood";
import Profile from "./pages/Profile";
import Recipes from "./pages/Recipes";
import RecipeDetails from "./pages/RecipeDetails";
import Chat from "./pages/Chat";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {

    return (
        <BrowserRouter>

            <Routes>

/*
   ROTAS PÚBLICAS

   Define as páginas que podem ser acessadas sem que o usuário
   esteja autenticado.

   - /: página inicial da aplicação, que direciona para o Login.
   - /login: tela de autenticação.
   - /register: tela de cadastro de novos usuários.

   Essas rotas ficam fora do ProtectedRoute porque não exigem
   um token de autenticação para serem acessadas.
*/

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

/*
   ROTAS PROTEGIDAS

   Agrupa as páginas que exigem autenticação para serem
   acessadas.

   - ProtectedRoute: impede o acesso de usuários que não
     possuem um token de autenticação válido.
   - Layout: fornece a estrutura visual compartilhada pelas
     páginas autenticadas, como a navegação lateral e o
     conteúdo principal.

   As rotas internas ficam dentro desses dois componentes
   para que todas recebam automaticamente essas regras.
*/

                <Route element={<ProtectedRoute />}>

                    <Route element={<Layout />}>

/*
   DASHBOARD E GERENCIAMENTO DE ALIMENTOS

   Define as rotas relacionadas ao acompanhamento e ao
   gerenciamento dos alimentos cadastrados pelo usuário.

   - /dashboard: apresenta um resumo da despensa e
     informações importantes sobre os alimentos.
   - /foods: lista os alimentos cadastrados.
   - /foods/new: permite cadastrar um novo alimento.
   - /foods/:id/edit: permite editar um alimento existente.

   Todas essas páginas utilizam a autenticação e o Layout
   definidos anteriormente.
 */

                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/foods"
                            element={<Foods />}
                        />

                        <Route
                            path="/foods/new"
                            element={<NewFood />}
                        />

                        <Route
                            path="/foods/:id/edit"
                            element={<EditFood />}
                        />

/* 
   PERFIL, RECEITAS E CHATBOT

   Define as rotas das funcionalidades complementares da
   área autenticada do IntelliFit.

   - /profile: apresenta as informações do usuário.
   - /recipes: apresenta sugestões de receitas com base nos
     alimentos cadastrados.
   - /recipes/:id: apresenta os detalhes de uma receita
     específica.
   - /chat: disponibiliza a interface do Assistente IntelliFit.

   As rotas de receitas utilizam um ID dinâmico para
   identificar a receita selecionada.
*/

                        <Route
                            path="/profile"
                            element={<Profile />}
                        />

                        <Route
                            path="/recipes"
                            element={<Recipes />}
                        />

                        <Route
                            path="/recipes/:id"
                            element={<RecipeDetails />}
                        />

                        <Route
                            path="/chat"
                            element={<Chat />}
                        />

                    </Route>

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;