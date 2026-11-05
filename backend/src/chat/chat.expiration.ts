import { todayInBrazilIso } from "../utils/expiration";
import { formatDateBR, normalizeText, parseDateInput } from "./chat.validation";

type ExpirationQuery =
    | { kind: "invalid" }
    | { kind: "nearest" }
    | { kind: "range"; start: string; end: string; title: string };

const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];
const namedMonthPattern = new RegExp(
    `\\bem (?:mes de )?(${monthNames.map(normalizeText).join("|")})(?: (?:de )?(\\d{4}))?\\b`,
);

function calendarDate(year: number, month: number, day: number): string {
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function parseExpirationQuery(
    message: string,
    today = todayInBrazilIso(),
): ExpirationQuery | null {
    const text = normalizeText(message);
    if (
        !/\b(venc[ea]|vencem|vencer|vencimento|vencimentos|validade|validades)\b/.test(
            text,
        )
    )
        return null;
    if (
        /\b(mude|mud[ae]r|alter[ea]|alterar|atualiz[ea]|atualizar|cadastre|cadastrar|exclua|excluir|apague|apagar|delete|deletar|comprei|comi|consumi|descarte|descartar)\b/.test(
            text,
        )
    )
        return null;

    const [year, month, day] = today.split("-").map(Number);
    const range = (
        start: string,
        end: string,
        title: string,
    ): ExpirationQuery => ({ kind: "range", start, end, title });

    const exact = message.match(
        /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/,
    );
    if (exact) {
        const date = parseDateInput(
            exact[0].split("/").length === 2 ? `${exact[0]}/${year}` : exact[0],
        );
        return date
            ? range(date, date, `Vencimentos em ${formatDateBR(date)}`)
            : { kind: "invalid" };
    }
    const namedMonth = text.match(namedMonthPattern);
    if (namedMonth) {
        const monthIndex = monthNames.findIndex(
            (name) => normalizeText(name) === namedMonth[1],
        );
        const selectedYear = namedMonth[2] ? Number(namedMonth[2]) : year;
        if (selectedYear < 1000 || selectedYear > 9998)
            return { kind: "invalid" };
        return range(
            calendarDate(selectedYear, monthIndex + 1, 1),
            calendarDate(selectedYear, monthIndex + 2, 0),
            `Vencimentos em ${monthNames[monthIndex]} de ${selectedYear}`,
        );
    }
    if (/\b(mes que vem|proximo mes)\b/.test(text)) {
        const start = calendarDate(year, month + 1, 1);
        return range(
            start,
            calendarDate(year, month + 2, 0),
            `Vencimentos em ${start.slice(5, 7)}/${start.slice(0, 4)}`,
        );
    }
    const namedYear = text.match(/\b(?:em |no ano de |no ano )(\d{4})\b/);
    if (namedYear || /\b(ano que vem|proximo ano)\b/.test(text)) {
        const selectedYear = namedYear ? Number(namedYear[1]) : year + 1;
        if (selectedYear < 1000 || selectedYear > 9998) return { kind: "invalid" };
        return range(
            calendarDate(selectedYear, 1, 1),
            calendarDate(selectedYear, 12, 31),
            `Vencimentos em ${selectedYear}`,
        );
    }
    const days = text.match(
        /\bproximos? (\d+|um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez) dias?\b/,
    );
    if (days) {
        const words = [
            "",
            "um",
            "dois",
            "tres",
            "quatro",
            "cinco",
            "seis",
            "sete",
            "oito",
            "nove",
            "dez",
        ];
        const count = /^\d+$/.test(days[1])
            ? Number(days[1])
            : words.indexOf(days[1]);
        if (count < 1 || count > 3650) return { kind: "invalid" };
        const end = calendarDate(year, month, day + count);
        return range(
            today,
            end,
            `Vencimentos de ${formatDateBR(today)} a ${formatDateBR(end)}`,
        );
    }
    if (/\b(hoje|amanha)\b/.test(text)) {
        const date = calendarDate(
            year,
            month,
            day + (/\bamanha\b/.test(text) ? 1 : 0),
        );
        return range(date, date, `Vencimentos em ${formatDateBR(date)}`);
    }
    if (
        /\b(mais pert[oa] de vencer|mais proxim[oa]s? de vencer|vence primeiro|vencem primeiro|vencimentos? mais proxim[oa]s?)\b/.test(
            text,
        )
    ) {
        return { kind: "nearest" };
    }
    return null;
}
