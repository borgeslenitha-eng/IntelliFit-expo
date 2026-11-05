import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFoods, getExpiringFoods, type Food, type ExpiringFood } from "../services/foodService";

function Dashboard() {
    const navigate = useNavigate();

    const [foods, setFoods] = useState<Food[]>([]);

    const [expiringFoods, setExpiringFoods] = useState<ExpiringFood[]>([]);

    const [error, setError] = useState("");

    const totalFoods = foods.length;

    const attentionFoods =
        expiringFoods.filter(
            (food) =>
                food.status === "TODAY" ||
                food.status === "ATTENTION"
        ).length;

    const expiredFoods =
        expiringFoods.filter(
            (food) => food.status === "EXPIRED"
        ).length;

    useEffect(() => {

        async function loadFoods() {

            try {

                const result = await getFoods();

                setFoods(result);

                const expiringResult =
                    await getExpiringFoods();

                setExpiringFoods(expiringResult);

            } catch (error) {

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(
                        "Erro ao carregar alimentos."
                    );
                }
            }
        }

        loadFoods();

    }, []);



    return (
        <div className="page-container">

            <div className="page-header">

                <div>
                    <h1>Dashboard</h1>

                    <p className="page-description">
                        Aqui está um resumo dos seus alimentos.
                    </p>
                </div>

            </div>

            {error && (
                <p>{error}</p>
            )}

            <div className="stats-grid">

                <div className="stat-card">

                    <span className="stat-label">
                        Total de alimentos
                    </span>

                    <strong className="stat-value">
                        {totalFoods}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Próximos do vencimento
                    </span>

                    <strong className="stat-value">
                        {attentionFoods}
                    </strong>

                </div>

                <div className="stat-card">

                    <span className="stat-label">
                        Alimentos vencidos
                    </span>

                    <strong className="stat-value">
                        {expiredFoods}
                    </strong>

                </div>

            </div>

            <div className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Ações rápidas
                    </h2>

                    <p>
                        Acesse rapidamente as principais funções.
                    </p>

                </div>

                <div className="quick-actions">

                    <button
                        className="quick-action"
                        onClick={() => navigate("/foods/new")}
                    >
                        <strong>
                            + Adicionar alimento
                        </strong>

                        <span>
                            Cadastre um novo alimento.
                        </span>
                    </button>

                    <button
                        className="quick-action"
                        onClick={() => navigate("/foods")}
                    >
                        <strong>
                            Ver alimentos
                        </strong>

                        <span>
                            Consulte e gerencie sua despensa.
                        </span>
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Dashboard;