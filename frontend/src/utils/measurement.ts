export function formatMeasurement(
    quantity: number,
    unit: string
): string {
    let displayQuantity = quantity;
    let displayUnit = unit;

    if (unit === "kg" && Math.abs(quantity) < 1 && quantity !== 0) {
        displayQuantity = quantity * 1000;
        displayUnit = "g";
    } else if (unit === "L" && Math.abs(quantity) < 1 && quantity !== 0) {
        displayQuantity = quantity * 1000;
        displayUnit = "ml";
    }

    const formatted = new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 2
    }).format(displayQuantity);

    return `${formatted} ${displayUnit}`;
}
