export function cosineSimilarity(
    a: Map<string, number>,
    b: Map<string, number>,
): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (const value of a.values()) {
        normA += value * value;
    }

    for (const value of b.values()) {
        normB += value * value;
    }

    for (const [term, valueA] of a.entries()) {
        const valueB = b.get(term) ?? 0;
        dot += valueA * valueB;
    }

    if (!normA || !normB) {
        return 0;
    }

    return Math.min(
        1,
        Math.max(0, dot / (Math.sqrt(normA) * Math.sqrt(normB))),
    );
}

function termFrequency(documentTokens: string[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const token of documentTokens) {
        counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    const total = documentTokens.length || 1;
    const frequencies = new Map<string, number>();

    for (const [term, count] of counts.entries()) {
        frequencies.set(term, count / total);
    }

    return frequencies;
}

/** Vocabulário e IDF são ajustados apenas no corpus de receitas. */
export class TfidfVectorizer {
    private idf = new Map<string, number>();

    public fit(documents: string[][]): this {
        const frequency = new Map<string, number>();
        for (const document of documents) {
            for (const term of new Set(document)) {
                frequency.set(term, (frequency.get(term) ?? 0) + 1);
            }
        }
        this.idf = new Map(
            Array.from(frequency, ([term, count]) => [
                term,
                Math.log((documents.length + 1) / (count + 1)) + 1,
            ]),
        );
        return this;
    }

    public transform(document: string[]): Map<string, number> {
        const vector = new Map<string, number>();
        for (const [term, frequency] of termFrequency(document)) {
            const idf = this.idf.get(term);
            if (idf !== undefined) vector.set(term, frequency * idf);
        }
        return vector;
    }
}
