import {
    type ChangeEvent,
    type FormEvent,
    useState
} from "react";
import {
    createFood,
    type CreateFood
} from "../services/foodService";
import {
    UNIT_GROUPS,
    maxExpirationIso,
    todayIso
} from "../utils/foodFormOptions";

function NewFood() {

    const [formData, setFormData] = useState<CreateFood>({
        name: "",
        category: "",
        quantity: 0,
        unit: "",
        storageLocation: "",
        expirationDate: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleChange(
        event: ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >
    ) {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]:
                name === "quantity"
                    ? Number(value)
                    : value
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");

        try {

            await createFood(formData);

            setSuccess(
                "Alimento cadastrado com sucesso!"
            );

            setFormData({
                name: "",
                category: "",
                quantity: 0,
                unit: "",
                storageLocation: "",
                expirationDate: ""
            });

        } catch (error) {

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Erro ao cadastrar alimento."
                );
            }
        }
    }

    return (
        <div className="page-container">

            <div className="page-header">

                <div>
                    <h1>Novo alimento</h1>

                    <p className="page-description">
                        Cadastre um alimento na sua despensa,
                        geladeira ou freezer.
                    </p>
                </div>

            </div>

            <div className="form-card">

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="name">
                            Nome do alimento
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-row">

                        <div className="form-group">

                            <label htmlFor="category">
                                Categoria
                            </label>

                            <input
                                id="category"
                                name="category"
                                type="text"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="quantity">
                                Quantidade
                            </label>

                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">

                            <label htmlFor="unit">
                                Unidade
                            </label>

                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Selecione
                                </option>

                                {UNIT_GROUPS.map((group) => (
                                    <optgroup
                                        key={group.label}
                                        label={group.label}
                                    >
                                        {group.options.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>

                        </div>

                        <div className="form-group">

                            <label htmlFor="storageLocation">
                                Local de armazenamento
                            </label>

                            <select
                                id="storageLocation"
                                name="storageLocation"
                                value={formData.storageLocation}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Selecione
                                </option>

                                <option value="DESPENSA">
                                    Despensa
                                </option>

                                <option value="GELADEIRA">
                                    Geladeira
                                </option>

                                <option value="FREEZER">
                                    Freezer
                                </option>

                            </select>

                        </div>

                    </div>

                    <div className="form-group">

                        <label htmlFor="expirationDate">
                            Data de validade
                        </label>

                        <input
                            id="expirationDate"
                            name="expirationDate"
                            type="date"
                            min={todayIso()}
                            max={maxExpirationIso()}
                            value={formData.expirationDate}
                            onChange={handleChange}
                            required
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

                    <div className="form-actions">

                        <button type="submit">
                            Cadastrar alimento
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default NewFood;