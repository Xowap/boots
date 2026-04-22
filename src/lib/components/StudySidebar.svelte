<script lang="ts">
    import {
        Plus,
        Trash2,
        Download,
        Upload,
        Search,
        X,
        Copy,
        Save,
    } from "lucide-svelte";
    import { studyManager } from "$lib/studies.svelte";

    let {
        isOpen = $bindable(),
        searchQuery = $bindable(),
        onNewStudy,
        onCloneStudy,
        onSaveAsStudy,
        onResetToAnonymous,
        onSelectStudy,
    } = $props<{
        isOpen: boolean;
        searchQuery: string;
        onNewStudy: () => void;
        onCloneStudy: () => void;
        onSaveAsStudy: () => void;
        onResetToAnonymous: () => void;
        onSelectStudy: (id: string) => void;
    }>();

    let importInput: HTMLInputElement | undefined = $state();

    const filteredStudies = $derived(
        studyManager.studies
            .filter((s) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => b.updatedAt - a.updatedAt)
    );

    function handleImport(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            studyManager.importStudies(content);
        };
        reader.readAsText(file);
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sidebar-overlay" onclick={() => (isOpen = false)}></div>
    <div class="sidebar">
        <div class="sidebar-header">
            <h3>Studies</h3>
            <button class="icon-button" onclick={() => (isOpen = false)}
                ><X size={20} /></button
            >
        </div>
        <div class="sidebar-content">
            <div class="search-box">
                <Search size={16} class="search-icon" />
                <input
                    type="text"
                    class="search-input"
                    bind:value={searchQuery}
                    placeholder="Search studies..."
                />
            </div>
            <div class="action-group">
                <button class="btn btn-primary" onclick={onNewStudy}
                    ><Plus size={16} /> New Study</button
                >
                {#if studyManager.currentStudyId}
                    <button class="btn btn-secondary" onclick={onCloneStudy}
                        ><Copy size={16} /> Clone</button
                    >
                    <button class="btn btn-ghost" onclick={onResetToAnonymous}
                        ><X size={14} /> Close Study</button
                    >
                {:else}
                    <button class="btn btn-secondary" onclick={onSaveAsStudy}
                        ><Save size={16} /> Save As...</button
                    >
                {/if}
            </div>
            <div class="section-label">Existing Studies</div>
            <div class="studies-list">
                {#each filteredStudies as study}
                    <div
                        class="study-item"
                        class:active={study.id === studyManager.currentStudyId}
                    >
                        <button
                            class="study-select"
                            onclick={() => onSelectStudy(study.id)}
                        >
                            <span class="study-name">{study.name}</span>
                            <span class="study-date"
                                >{new Date(
                                    study.updatedAt
                                ).toLocaleDateString()}</span
                            >
                        </button>
                        <div class="study-actions">
                            <button
                                class="action-button"
                                onclick={() =>
                                    studyManager.exportStudy(study.id)}
                                ><Download size={14} /></button
                            >
                            <button
                                class="action-button delete-button"
                                onclick={() =>
                                    studyManager.deleteStudy(study.id)}
                                ><Trash2 size={14} /></button
                            >
                        </div>
                    </div>
                {/each}
                {#if filteredStudies.length === 0}<div class="empty-state">
                        No studies found
                    </div>{/if}
            </div>
        </div>
        <div class="sidebar-footer">
            <button
                class="btn btn-secondary full-width"
                onclick={() => importInput?.click()}
                ><Upload size={16} /> Import Studies</button
            >
            <input
                type="file"
                bind:this={importInput}
                onchange={handleImport}
                accept=".json"
                style="display: none"
            />
        </div>
    </div>
{/if}

<style lang="scss">
    .sidebar-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.2);
        backdrop-filter: blur(2px);
        z-index: 1000;
    }
    .sidebar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 360px;
        background: white;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        box-shadow: 20px 0 25px -5px rgb(0 0 0 / 0.1);
        border-right: 1px solid #e2e8f0;
    }
    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid #f1f5f9;

        h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: #0f172a;
        }
    }

    .sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .action-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .section-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        margin-top: 12px;
        margin-bottom: -8px;
    }
    .studies-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .study-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px;
        border-radius: 8px;
        transition: background 0.2s;
        border: 1px solid transparent;

        &:hover {
            background: #f8fafc;
        }

        &.active {
            background: #f1f5f9;
            border-color: #e2e8f0;
        }
    }

    .study-select {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        text-align: left;
    }
    .study-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.95rem;
    }
    .study-date {
        font-size: 0.75rem;
        color: #94a3b8;
    }
    .study-actions {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    .action-button {
        padding: 8px;
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: #e2e8f0;
            color: #475569;
        }
    }

    .delete-button:hover {
        background: #fee2e2;
        color: #ef4444;
    }
    .sidebar-footer {
        padding: 24px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        gap: 12px;
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
    .empty-state {
        text-align: center;
        padding: 20px;
        color: #94a3b8;
        font-size: 0.9rem;
        font-style: italic;
    }

    .full-width {
        width: 100%;
    }
</style>
