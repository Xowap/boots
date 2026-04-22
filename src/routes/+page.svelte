<script lang="ts">
    import { onMount, untrack } from "svelte";
    import data from "$lib/data/capabilities.json";
    import { studyManager } from "$lib/studies.svelte";
    import { FileJson, Menu as MenuIcon } from "lucide-svelte";

    import Graph from "$lib/components/Graph.svelte";
    import StudySidebar from "$lib/components/StudySidebar.svelte";
    import CapabilityPanel from "$lib/components/CapabilityPanel.svelte";
    import QuestionnaireDialog from "$lib/components/QuestionnaireDialog.svelte";
    import StudyNamingDialog from "$lib/components/StudyNamingDialog.svelte";
    import Legend from "$lib/components/Legend.svelte";

    import { calculateManualScore } from "$lib/utils/maturity";
    import { runAutoPropagation } from "$lib/utils/propagation";
    import type cytoscape from "cytoscape";

    let selectedNodeId = $state<string | null>(null);
    let selectedNodeName = $state<string>("");
    let maturity = $state<Record<string, any>>({});
    let cy = $state<cytoscape.Core>();

    let isMenuOpen = $state(false);
    let searchQuery = $state("");
    let initialized = $state(false);

    // Dialog State
    let isDialogOpen = $state(false);
    let isQuestionnaireOpen = $state(false);
    let questionnaireAnswers = $state<Record<string, number>>({});
    let dialogTitle = $state("");
    let dialogStudyName = $state("");
    let dialogAction = $state<"create" | "save_as" | "clone">("create");

    const selectedCapability = $derived(
        data.capabilities.find((c) => c.id === selectedNodeId)
    );

    function handleQuestionnaireComplete() {
        if (selectedNodeId && selectedCapability?.questionnaire?.sections) {
            const subScores: Record<string, number> = {};

            selectedCapability.questionnaire.sections.forEach(
                (section: any) => {
                    let total = 0;
                    let count = 0;
                    section.questions.forEach((q: any) => {
                        if (questionnaireAnswers[q.id] !== undefined) {
                            total += (5 - questionnaireAnswers[q.id]) / 4;
                            count++;
                        }
                    });

                    if (count > 0) {
                        subScores[section.id] = Math.round(
                            (total / section.questions.length) * 100
                        );
                    }
                }
            );

            if (Object.keys(subScores).length > 0) {
                const cap = maturity[selectedNodeId];
                if (!cap.subScores) cap.subScores = {};
                for (const [sid, score] of Object.entries(subScores)) {
                    cap.subScores[sid] = score;
                }
            }

            maturity[selectedNodeId].mode = "manual";
        }
        isQuestionnaireOpen = false;
    }

    $effect(() => {
        if (!initialized) return;

        // 1. Calculate Main Scores from Sub-scores (for MANUAL mode)
        for (const id in maturity) {
            const cap = maturity[id];
            if (
                cap.mode === "manual" &&
                cap.subScores &&
                Object.keys(cap.subScores).length > 0
            ) {
                const finalScore = calculateManualScore(cap.subScores);
                if (cap.score !== finalScore) {
                    untrack(() => {
                        maturity[id].score = finalScore;
                    });
                }
            }
        }

        // 2. PageRank-like propagation (for AUTO mode)
        if (cy) {
            runAutoPropagation(cy, data.capabilities, maturity);
        }

        // 3. Auto-save
        const currentId = studyManager.currentStudyId;
        if (currentId) {
            const dataToSave = JSON.parse(JSON.stringify(maturity));
            untrack(() => {
                studyManager.updateStudy(currentId, dataToSave);
            });
        }
    });

    function resetMaturity() {
        const newMaturity: Record<string, any> = {};
        data.capabilities.forEach((cap) => {
            const capWithQuest = cap as any;
            const subScores: Record<string, number> = {};
            if (capWithQuest.questionnaire?.sections) {
                capWithQuest.questionnaire.sections.forEach((s: any) => {
                    subScores[s.id] = 0;
                });
            }
            newMaturity[cap.id] = {
                score: 0,
                mode: "auto",
                subScores:
                    Object.keys(subScores).length > 0 ? subScores : undefined,
            };
        });
        maturity = newMaturity;
    }

    onMount(() => {
        if (studyManager.currentStudyId) {
            const study = studyManager.studies.find(
                (s) => s.id === studyManager.currentStudyId
            );
            if (study) maturity = JSON.parse(JSON.stringify(study.data));
        } else {
            resetMaturity();
        }
        initialized = true;
    });

    function openNamingDialog(action: "create" | "save_as" | "clone") {
        dialogAction = action;
        dialogStudyName = "";
        if (action === "create") {
            dialogTitle = "New Study";
        } else if (action === "save_as") {
            dialogTitle = "Save Study";
        } else if (action === "clone") {
            const current = studyManager.studies.find(
                (s) => s.id === studyManager.currentStudyId
            );
            dialogStudyName = current ? `${current.name} (Copy)` : "";
            dialogTitle = "Clone Study";
        }
        isDialogOpen = true;
    }

    function handleDialogSubmit() {
        if (!dialogStudyName) return;
        const dataToSave = JSON.parse(JSON.stringify(maturity));
        if (dialogAction === "create") {
            resetMaturity();
            studyManager.createStudy(
                dialogStudyName,
                JSON.parse(JSON.stringify(maturity))
            );
        } else {
            studyManager.createStudy(dialogStudyName, dataToSave);
        }
        isDialogOpen = false;
    }

    function selectStudy(id: string) {
        const study = studyManager.studies.find((s) => s.id === id);
        if (study) {
            maturity = JSON.parse(JSON.stringify(study.data));
            studyManager.currentStudyId = id;
        }
    }

    function resetToAnonymous() {
        resetMaturity();
        studyManager.currentStudyId = null;
    }
</script>

<svelte:head>
    <title>Boots - Maturity Map</title>
</svelte:head>

<div class="app-container">
    <Graph
        capabilities={data.capabilities}
        relationships={data.relationships}
        bind:maturity
        bind:selectedNodeId
        bind:selectedNodeName
        bind:cy
    />

    <div class="top-bar">
        <button
            class="menu-button"
            onclick={() => (isMenuOpen = !isMenuOpen)}
            title="Manage Studies"
        >
            <MenuIcon size={20} />
            <span>Studies</span>
        </button>
        {#if studyManager.currentStudyId}
            {@const currentStudy = studyManager.studies.find(
                (s) => s.id === studyManager.currentStudyId
            )}
            <div class="current-study-badge">
                <FileJson size={14} />
                <span>{currentStudy?.name}</span>
            </div>
        {/if}
    </div>

    <StudySidebar
        bind:isOpen={isMenuOpen}
        bind:searchQuery
        onNewStudy={() => openNamingDialog("create")}
        onCloneStudy={() => openNamingDialog("clone")}
        onSaveAsStudy={() => openNamingDialog("save_as")}
        onResetToAnonymous={resetToAnonymous}
        onSelectStudy={selectStudy}
    />

    <StudyNamingDialog
        bind:open={isDialogOpen}
        title={dialogTitle}
        bind:studyName={dialogStudyName}
        onSubmit={handleDialogSubmit}
    />

    <QuestionnaireDialog
        bind:open={isQuestionnaireOpen}
        {selectedNodeName}
        capability={selectedCapability}
        bind:answers={questionnaireAnswers}
        onComplete={handleQuestionnaireComplete}
    />

    <CapabilityPanel
        bind:selectedNodeId
        {selectedNodeName}
        {selectedCapability}
        bind:maturity
        onHelpEvaluate={() => {
            questionnaireAnswers = {};
            isQuestionnaireOpen = true;
        }}
    />

    <Legend />
</div>

<style lang="scss">
    .app-container {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }
    .top-bar {
        position: absolute;
        top: 24px;
        left: 24px;
        display: flex;
        gap: 12px;
        align-items: center;
        z-index: 50;
    }
    .menu-button {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        cursor: pointer;

        &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
        }
    }
    .current-study-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #e2e8f0;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #475569;
        border: 1px solid #cbd5e1;
    }
</style>
