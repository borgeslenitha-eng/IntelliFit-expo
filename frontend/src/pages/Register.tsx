import { type FormEvent, useState } from "react";

import { Link } from "react-router-dom";
import { register } from "../services/authService";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        try {

            await register({
                name,
                email,
                password
            });

            setSuccess(
                "Conta criada com sucesso! Você já pode entrar."
            );

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

        } catch (error) {

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Erro ao realizar cadastro.");
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
                        Crie sua conta
                    </h2>

                    <p>
                        Cadastre-se para começar a
                        organizar seus alimentos.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="name">
                            Nome
                        </label>

                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Digite seu nome"
                        />

                    </div>

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
                            placeholder="Digite seu e-mail"
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
                            placeholder="Digite sua senha"
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="confirmPassword">
                            Confirmar senha
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Confirme sua senha"
                        />

                    </div>

                    {error && (
                        <p className="form-error">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="form-success">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                    >
                        Criar conta
                    </button>

                </form>

                <p className="auth-footer">
                    Já possui uma conta?
                    <Link to="/login">
                        Entrar
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;