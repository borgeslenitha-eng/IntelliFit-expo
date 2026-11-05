import {
    Navigate,
    Outlet
} from "react-router-dom";

/*
   PROTEÇÃO DAS ROTAS

   Verifica se existe um token de autenticação armazenado
   no navegador antes de permitir o acesso às páginas
   protegidas.

   - Com token: permite que a página protegida seja
     renderizada através do Outlet.
   - Sem token: redireciona o usuário para a tela de Login.

   Esse componente é utilizado no App.tsx para proteger
   toda a área autenticada da aplicação.
*/

function ProtectedRoute() {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    /* O Outlet renderiza a página correspondente à rota
   protegida que foi acessada pelo usuário. */
    return <Outlet />;
}

export default ProtectedRoute;