<script lang="ts">
    import { onMount } from "svelte";
    import cytoscape from "cytoscape";
    import dagre from "cytoscape-dagre";
    import { getMaturityColor } from "$lib/utils/maturity";

    let {
        capabilities,
        relationships,
        maturity = $bindable(),
        selectedNodeId = $bindable(),
        selectedNodeName = $bindable(),
        cy = $bindable(),
    } = $props<{
        capabilities: any[];
        relationships: any[];
        maturity: Record<string, any>;
        selectedNodeId: string | null;
        selectedNodeName: string;
        cy: cytoscape.Core | undefined;
    }>();

    let container: HTMLDivElement;

    function updateNodeStyle(
        nodeId: string,
        value: number,
        isSelected: boolean,
        mode: "auto" | "manual" = "manual"
    ) {
        if (!cy) return;
        const node = cy.$id(nodeId);
        if (node) {
            const maturityColor = getMaturityColor(value);
            const progressColor = getMaturityColor(value, true);
            const borderWidth = isSelected ? 8 : 3;
            const borderStyle = mode === "auto" ? "dashed" : "solid";
            node.style({
                "border-color": maturityColor,
                "border-width": borderWidth,
                "border-style": borderStyle,
                "background-gradient-stop-colors": `${progressColor} ${progressColor} #ffffff`,
                "background-gradient-stop-positions": `0% ${value}% ${value}%`,
            } as any);
        }
    }

    onMount(() => {
        cytoscape.use(dagre);
        const elements = [
            ...capabilities.map((cap: any) => ({
                data: { id: cap.id, label: cap.name },
            })),
            ...relationships.map((rel: any) => ({
                data: { source: rel.source, target: rel.target },
            })),
        ];
        cy = cytoscape({
            container: container,
            elements: elements,
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "#ffffff",
                        label: "data(label)",
                        color: "#334155",
                        "text-valign": "center",
                        "text-halign": "center",
                        "font-size": "12px",
                        width: "160px",
                        height: "50px",
                        shape: "round-rectangle",
                        "text-wrap": "wrap",
                        "text-max-width": "140px",
                        "font-weight": "600",
                        "border-style": "solid",
                        "border-width": 3,
                        "border-color": "#ef4444",
                        "background-fill": "linear-gradient",
                        "background-gradient-direction": "to-right",
                        "background-gradient-stop-colors":
                            "#fee2e2 #fee2e2 #ffffff",
                        "background-gradient-stop-positions": "0% 0% 0%",
                        "transition-property":
                            "border-color, background-gradient-stop-positions, border-width",
                        "transition-duration": 200,
                    } as any,
                },
                {
                    selector: "edge",
                    style: {
                        width: 2,
                        "line-color": "#cbd5e1",
                        "target-arrow-color": "#cbd5e1",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier",
                        opacity: 0.6,
                    },
                },
            ],
            layout: {
                name: "dagre",
                rankDir: "LR",
                nodeSep: 60,
                rankSep: 120,
            } as any,
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            selectionType: "single",
        });

        capabilities.forEach((cap: any) => updateNodeStyle(cap.id, 0, false));

        cy.on("tap", "node", (evt: any) => {
            const node = evt.target;
            selectedNodeId = node.id();
            selectedNodeName = node.data("label");
        });

        cy.on("tap", (evt: any) => {
            if (evt.target === cy) {
                selectedNodeId = null;
                selectedNodeName = "";
            }
        });

        const handleResize = () => {
            if (cy) {
                cy.resize();
                cy.fit();
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cy?.destroy();
        };
    });

    $effect(() => {
        if (cy) {
            capabilities.forEach((cap: any) => {
                const val = maturity[cap.id]?.score ?? 0;
                const mode = maturity[cap.id]?.mode ?? "manual";
                const isSelected = cap.id === selectedNodeId;
                updateNodeStyle(cap.id, val, isSelected, mode);
            });
        }
    });
</script>

<div class="graph-container" bind:this={container}></div>

<style lang="scss">
    .graph-container {
        width: 100%;
        height: 100%;
    }
</style>
