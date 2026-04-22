export function getMaturityColor(value: number, faded = false) {
    let color = "#ef4444";
    if (value >= 25) color = "#f97316";
    if (value >= 50) color = "#f59e0b";
    if (value >= 75) color = "#22c55e";
    if (faded) {
        if (color === "#ef4444") return "#fee2e2";
        if (color === "#f97316") return "#ffedd5";
        if (color === "#f59e0b") return "#fef3c7";
        if (color === "#22c55e") return "#dcfce7";
    }
    return color;
}

export function calculateManualScore(subScores: Record<string, number>): number {
    const scores = Object.values(subScores);
    if (scores.length === 0) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const index = 0.25 * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return Math.round(
        sorted[lower] * (1 - weight) + sorted[upper] * weight
    );
}
