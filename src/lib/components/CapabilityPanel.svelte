<script lang="ts">
    import { Search } from "lucide-svelte";
    import { Slider } from "bits-ui";
    import { getMaturityColor } from "$lib/utils/maturity";

    let {
        selectedNodeId = $bindable(),
        selectedNodeName,
        selectedCapability,
        maturity = $bindable(),
        onHelpEvaluate,
    } = $props<{
        selectedNodeId: string | null;
        selectedNodeName: string;
        selectedCapability: any;
        maturity: Record<string, any>;
        onHelpEvaluate: () => void;
    }>();
</script>

<div class="floating-ui">
    {#if selectedNodeId}
        <div class="panel">
            <header>
                <div class="title-group">
                    <span class="label">Capability</span>
                    <div class="name-row">
                        <h2>{selectedNodeName}</h2>
                        {#if selectedCapability?.questionnaire}
                            <button
                                class="help-button"
                                onclick={onHelpEvaluate}
                                title="Help Evaluate"
                            >
                                <Search size={12} />
                                <span>Help Evaluate</span>
                            </button>
                        {/if}
                    </div>
                </div>
                <button
                    class="close-panel"
                    onclick={() => (selectedNodeId = null)}>&times;</button
                >
            </header>

            <div class="control-group">
                <div class="mode-selector">
                    <button
                        class:active={maturity[selectedNodeId]?.mode ===
                            "manual"}
                        onclick={() => {
                            if (selectedNodeId)
                                maturity[selectedNodeId].mode = "manual";
                        }}>Manual</button
                    >
                    <button
                        class:active={maturity[selectedNodeId]?.mode === "auto"}
                        onclick={() => {
                            if (selectedNodeId)
                                maturity[selectedNodeId].mode = "auto";
                        }}>Auto</button
                    >
                </div>

                <div
                    class="slider-header"
                    class:disabled={maturity[selectedNodeId]?.mode === "auto"}
                >
                    <span class="maturity-label">Evaluation</span>
                    <span
                        class="maturity-value"
                        style="color: {getMaturityColor(
                            maturity[selectedNodeId]?.score ?? 0
                        )}"
                    >
                        {maturity[selectedNodeId]?.score ?? 0}%
                    </span>
                </div>

                <div class="main-score-progress">
                    <div class="progress-track">
                        <div
                            class="progress-fill"
                            style="width: {maturity[selectedNodeId]?.score ??
                                0}%; background: {getMaturityColor(
                                maturity[selectedNodeId]?.score ?? 0
                            )}"
                        ></div>
                    </div>
                </div>

                <div class="slider-markers">
                    <span>Low</span>
                    <span>Elite</span>
                </div>

                {#if maturity[selectedNodeId]?.mode === "manual" && selectedCapability?.questionnaire?.sections}
                    <div class="sub-capabilities-section">
                        <div class="section-label">Sub-capabilities</div>
                        <div class="sub-capabilities-list">
                            {#each selectedCapability.questionnaire.sections as section}
                                <div class="sub-cap-item">
                                    <div class="sub-cap-header">
                                        <span class="sub-cap-name"
                                            >{section.name}</span
                                        >
                                        <span
                                            class="sub-cap-value"
                                            style="color: {getMaturityColor(
                                                maturity[selectedNodeId]
                                                    ?.subScores?.[section.id] ??
                                                    0
                                            )}"
                                        >
                                            {maturity[selectedNodeId]
                                                ?.subScores?.[section.id] ??
                                                0}%
                                        </span>
                                    </div>
                                    <Slider.Root
                                        type="multiple"
                                        value={[
                                            maturity[selectedNodeId]
                                                ?.subScores?.[section.id] ?? 0,
                                        ]}
                                        onValueChange={(v: number[]) => {
                                            if (
                                                selectedNodeId &&
                                                maturity[selectedNodeId]
                                                    .mode === "manual"
                                            ) {
                                                const cap =
                                                    maturity[selectedNodeId];
                                                if (!cap.subScores)
                                                    cap.subScores = {};
                                                cap.subScores[section.id] =
                                                    v[0];
                                            }
                                        }}
                                        max={100}
                                        step={5}
                                        class="slider-root"
                                    >
                                        <div class="slider-track">
                                            <div
                                                class="slider-range"
                                                style="width: {maturity[
                                                    selectedNodeId
                                                ]?.subScores?.[section.id] ??
                                                    0}%; background: {getMaturityColor(
                                                    maturity[selectedNodeId]
                                                        ?.subScores?.[
                                                        section.id
                                                    ] ?? 0
                                                )}"
                                            ></div>
                                        </div>
                                        <Slider.Thumb
                                            index={0}
                                            class="slider-thumb"
                                        />
                                    </Slider.Root>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="welcome-badge">
            Select a capability to evaluate maturity
        </div>
    {/if}
</div>

<style lang="scss">
    .floating-ui {
        position: absolute;
        top: 24px;
        right: 24px;
        z-index: 100;
        pointer-events: none;
    }
    .panel {
        pointer-events: auto;
        width: 320px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        padding: 24px;
        border: 1px solid #e2e8f0;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
    }
    .main-score-progress {
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
    }
    .progress-track {
        height: 100%;
        width: 100%;
        background: #f1f5f9;
        border-radius: 4px;
    }
    .progress-fill {
        height: 100%;
        transition: all 0.3s ease;
        border-radius: 4px;
    }
    .sub-capabilities-section {
        margin-top: 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        border-top: 1px solid #f1f5f9;
        padding-top: 24px;
    }
    .sub-capabilities-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .sub-cap-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .sub-cap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .sub-cap-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
    }
    .sub-cap-value {
        font-size: 0.85rem;
        font-weight: 800;
    }
    .welcome-badge {
        background: white;
        padding: 10px 20px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        border: 1px solid #e2e8f0;
    }
    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
    }
    .label {
        display: block;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        margin-bottom: 4px;
    }
    header h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
    }
    .name-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 4px;
    }
    .help-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: #dbeafe;
        }
    }

    .close-panel {
        background: #f1f5f9;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        flex-shrink: 0;
    }

    .slider-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 12px;

        &.disabled {
            opacity: 0.5;
        }
    }
    .maturity-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
    }
    .maturity-value {
        font-size: 1.1rem;
        font-weight: 800;
    }
    .mode-selector {
        display: flex;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 8px;
        margin-bottom: 20px;

        button {
            flex: 1;
            border: none;
            background: none;
            padding: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;

            &.active {
                background: white;
                color: #1e293b;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            }
        }
    }

    .slider-markers {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 0.6rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
    }

    .section-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }
</style>
