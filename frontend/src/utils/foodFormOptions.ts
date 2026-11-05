export type UnitOption = {
    value: string;
    label: string;
};

export type UnitGroup = {
    label: string;
    options: UnitOption[];
};

export const UNIT_GROUPS: UnitGroup[] = [
    {
        label: "Contagem",
        options: [
            { value: "un", label: "Unidade (un)" }
        ]
    },
    {
        label: "Massa",
        options: [
            { value: "g", label: "Gramas (g)" },
            { value: "kg", label: "Quilogramas (kg)" }
        ]
    },
    {
        label: "Volume",
        options: [
            { value: "ml", label: "Mililitros (ml)" },
            { value: "L", label: "Litros (L)" }
        ]
    }
];

export const UNIT_OPTIONS: UnitOption[] =
    UNIT_GROUPS.flatMap((group) => group.options);

const UNIT_ALIASES: Record<string, string> = {
    un: "un",
    und: "un",
    unidade: "un",
    unidades: "un",
    g: "g",
    grama: "g",
    gramas: "g",
    kg: "kg",
    quilo: "kg",
    quilos: "kg",
    quilograma: "kg",
    quilogramas: "kg",
    ml: "ml",
    mililitro: "ml",
    mililitros: "ml",
    l: "L",
    litro: "L",
    litros: "L"
};

export function normalizeUnitForForm(value: string): string {
    const normalized = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    return UNIT_ALIASES[normalized] ?? "";
}

function localIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function todayIso(): string {
    return localIsoDate(new Date());
}

export function maxExpirationIso(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    return localIsoDate(date);
}
