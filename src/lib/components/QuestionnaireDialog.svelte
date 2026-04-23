<script lang="ts">
    import { Dialog } from "bits-ui";
    import { X } from "lucide-svelte";

    let {
        open = $bindable(),
        selectedNodeName,
        capability,
        answers = $bindable(),
        onComplete,
    } = $props<{
        open: boolean;
        selectedNodeName: string;
        capability: any;
        answers: Record<string, number>;
        onComplete: () => void;
    }>();
</script>

<Dialog.Root bind:open>
    <Dialog.Portal>
        <Dialog.Overlay class="dialog-overlay" />
        <Dialog.Content class="dialog-content questionnaire-content">
            <div class="questionnaire-header">
                <Dialog.Title class="dialog-title"
                    >Evaluate {selectedNodeName}</Dialog.Title
                >
                <button class="icon-button" onclick={() => (open = false)}
                    ><X size={20} /></button
                >
            </div>
            <Dialog.Description class="dialog-description questionnaire-desc"
                >Estimate maturity based on the following indicators.</Dialog.Description
            >
            <div class="questions-list">
                {#if capability?.questionnaire?.sections}
                    {#each capability.questionnaire.sections as section}
                        <div class="question-section">
                            <h3 class="section-title">
                                {section.name}
                            </h3>
                            <div class="section-questions">
                                {#each section.questions as question}
                                    <div class="question-item">
                                        <p class="question-text">
                                            {question.text}
                                        </p>
                                        <div class="likert-scale">
                                            {#each [{ v: 1, l: "Strongly Disagree" }, { v: 2, l: "Disagree" }, { v: 3, l: "Neutral" }, { v: 4, l: "Agree" }, { v: 5, l: "Strongly Agree" }] as opt}
                                                <label
                                                    class="likert-option"
                                                    class:active={answers[
                                                        question.id
                                                    ] === opt.v}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={question.id}
                                                        value={opt.v}
                                                        bind:group={
                                                            answers[question.id]
                                                        }
                                                    />
                                                    <span class="option-dot"
                                                    ></span>
                                                    <span class="option-label"
                                                        >{opt.l}</span
                                                    >
                                                </label>
                                            {/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
            <div class="dialog-actions">
                <button class="cancel-button" onclick={() => (open = false)}
                    >Cancel</button
                >
                <button class="confirm-button" onclick={onComplete}
                    >Apply Evaluation</button
                >
            </div>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<style lang="scss">
    .questionnaire-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 32px 32px 12px 32px;
        flex-shrink: 0;
        background: white;
    }

    .questions-list {
        display: flex;
        flex-direction: column;
        gap: 48px;
        padding: 32px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
    }

    .question-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .section-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
    }
    .section-questions {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
    .question-item {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .question-text {
        font-weight: 600;
        color: #1e293b;
        margin: 0;
        font-size: 0.95rem;
    }
    .likert-scale {
        display: flex;
        justify-content: space-between;
        background: #f8fafc;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #f1f5f9;
    }
    .likert-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        position: relative;
    }
    .likert-option input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
    }
    .option-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #cbd5e1;
        background: white;
        transition: all 0.2s;
    }
    .likert-option:hover .option-dot {
        border-color: #94a3b8;
    }
    .likert-option.active .option-dot {
        border-color: #3b82f6;
        background: #3b82f6;
        box-shadow: inset 0 0 0 3px white;
    }
    .option-label {
        font-size: 0.6rem;
        font-weight: 700;
        color: #94a3b8;
        text-align: center;
        text-transform: uppercase;
        max-width: 60px;
        line-height: 1.2;
    }
    .likert-option.active .option-label {
        color: #3b82f6;
    }

    .icon-button {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #64748b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;

        &:hover {
            background: #f1f5f9;
        }
    }
</style>
