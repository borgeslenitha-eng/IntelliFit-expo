import {
    type ChangeEvent,
    type FormEvent,
    useEffect,
    useState
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
    getFoodById,
    updateFood,
    type CreateFood
} from "../services/foodService";
import {
    UNIT_GROUPS,
    UNIT_OPTIONS,
    maxExpirationIso,
    normalizeUnitForForm,
    todayIso
} from "../utils/foodFormOptions";

function EditFood() {

    const { id } = useParams();
    const navigate = useNavigate();

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
    const [originalExpirationDate, setOriginalExpirationDate] = useState("");

    const unitExistsInManualOptions = UNIT_OPTIONS.some(
        (option) => option.value === formData.unit
    );

    useEffect(() => {

        async function loadFood() {

            try {

                const food =
                    await getFoodById(Number(id));

                const expirationDate =
                    food.expirationDate.split("T")[0];

                setOriginalExpirationDate(expirationDate);

                setFormData({
                    name: food.name,
                    category: food.category,
                    quantity: food.quantity,
                    unit: normalizeUnitForForm(food.unit),
                    storageLocation:
                        food.storageLocation,
                    expirationDate
                });

            } catch (error) {

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(
                        "Erro ao carregar alimento."
                    );
                }
            }
        }

        loadFood();

    }, [id]);

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

            if (
                formData.expirationDate < todayIso() &&
                formData.expirationDate !== originalExpirationDate
            ) {
                throw new Error(
                    "A nova data de validade não pode ser anterior à data atual."
                );
            }

            await updateFood(
                Number(id),
                formData
            );

            setSuccess(
                "Alimento atualizado com sucesso!"
            );

            setTimeout(() => {
                navigate("/foods");
            }, 1000);

        } catch (error) {

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Erro ao atualizar alimento."
                );
            }
        }
    }

    return (
        <div className="page-container">

            <div className="page-header">

                <div>
                    <h1>Editar alimento</h1>

                    <p className="page-description">
                        Atualize as informações do alimento
                        cadastrado.
                    </p>
                </div>

            </div>

            <div className="form-card">

                {error && (
                    <p className="form-error">
                        {error}
                    </p>
                )}

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

                                {formData.unit && !unitExistsInManualOptions && (
                                    <option value={formData.unit}>
                                        {formData.unit} (unidade atual)
                                    </option>
                                )}

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
                            max={maxExpirationIso()}
                            value={formData.expirationDate}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    {success && (
                        <p className="form-success">
                            {success}
                        </p>
                    )}

                    <div className="form-actions">

                        <button type="submit">
                            Salvar alterações
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default EditFood;