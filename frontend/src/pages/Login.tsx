import { type FormEvent, useState } from "react";

import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

import { login } from "../services/authService";

function Login() {


    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");

        try {

            const result = await login({ email, password });

            localStorage.setItem("token", result.token);

            navigate("/dashboard");

        } catch (error) {

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Erro ao realizar login.");
            }
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-header">

                    <h1>
                        IntelliFit
                    </h1>

                    <h2>
                        Bem-vindo de volta
                    </h2>

                    <p>
                        Entre na sua conta para gerenciar
                        seus alimentos.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="email">
                            E-mail
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="password">
                            Senha
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                        />

                    </div>

                    {error && (
                        <p className="form-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                    >
                        Entrar
                    </button>

                </form>

                <p className="auth-footer">
                    Ainda não possui uma conta?
                    <Link to="/register">
                        Cadastre-se
                    </Link>
                </p>

            </div>

        </div>
    );


}

export default Login;
