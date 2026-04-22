import type cytoscape from "cytoscape";

export function runAutoPropagation(
    cy: cytoscape.Core,
    capabilities: any[],
    maturity: Record<string, any>,
    DAMPING = 0.85
) {
    const nodes = capabilities.map((c) => c.id);
    const incoming = nodes.reduce(
        (acc, id) => {
            acc[id] = cy
                .$id(id)
                .incomers("node")
                .map((n) => n.id());
            return acc;
        },
        {} as Record<string, string[]>
    );

    let currentScores = nodes.reduce(
        (acc, id) => {
            acc[id] = maturity[id]?.score ?? 0;
            return acc;
        },
        {} as Record<string, number>
    );

    for (let i = 0; i < 10; i++) {
        let nextScores = { ...currentScores };
        let changedThisIter = false;

        for (const id of nodes) {
            if (maturity[id]?.mode === "auto") {
                const parents = incoming[id];
                if (parents.length === 0) {
                    if (nextScores[id] !== 0) {
                        nextScores[id] = 0;
                        changedThisIter = true;
                    }
                    continue;
                }
                let sumParents = 0;
                for (const p of parents) sumParents += currentScores[p];
                const avgParentScore = sumParents / parents.length;
                const newVal = Math.min(
                    100,
                    Math.round(avgParentScore * DAMPING)
                );

                if (nextScores[id] !== newVal) {
                    nextScores[id] = newVal;
                    changedThisIter = true;
                }
            }
        }
        currentScores = nextScores;
        if (!changedThisIter) break;
    }

    let changedAny = false;
    for (const id of nodes) {
        if (
            maturity[id].mode === "auto" &&
            maturity[id].score !== currentScores[id]
        ) {
            maturity[id].score = currentScores[id];
            changedAny = true;
        }
    }
    return changedAny;
}
