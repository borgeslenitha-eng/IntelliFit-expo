import { useEffect, useState } from "react";

import { getCurrentUser, type CurrentUser } from "../services/authService";

function Profile() {

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [error, setError] =
        useState("");

    useEffect(() => {

        async function loadUser() {

            try {

                const currentUser =
                    await getCurrentUser();

                setUser(currentUser);

            } catch (error) {

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(
                        "Erro ao carregar dados do usuário."
                    );
                }
            }
        }

        loadUser();

    }, []);

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h1>Meu perfil</h1>

                    <p className="page-description">
                        Visualize e gerencie as informações
                        da sua conta.
                    </p>
                </div>
            </div>

            {error && (
                <p className="form-error">
                    {error}
                </p>
            )}

            <div className="profile-card">

                <div className="profile-section">

                    <div className="section-header">
                        <h2>
                            Informações pessoais
                        </h2>

                        <p>
                            Dados associados à sua conta.
                        </p>
                    </div>

                    <div className="profile-info">

                        <div className="profile-field">
                            <span className="profile-label">
                                Nome
                            </span>

                            <span className="profile-value">
                                {user?.name || "Carregando..."}
                            </span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">
                                E-mail
                            </span>

                            <span className="profile-value">
                                {user?.email || "Carregando..."}
                            </span>
                        </div>

                    </div>

                </div>

                <div className="profile-section">

                    <div className="section-header">
                        <h2>
                            Conta
                        </h2>

                        <p>
                            Configurações relacionadas à sua conta.
                        </p>
                    </div>

                    <div className="profile-actions">

                        <button
                            className="button-secondary"
                        >
                            Alterar senha
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Profile;