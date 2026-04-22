<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import cytoscape from 'cytoscape';
    import dagre from 'cytoscape-dagre';
    import data from '$lib/data/capabilities.json';
    import { Slider, Dialog } from 'bits-ui';
    import type { CapabilityData } from '$lib/studies.svelte';
    import { studyManager } from '$lib/studies.svelte';
    import { 
        Plus, 
        Trash2, 
        Download, 
        Upload, 
        Search,
        X,
        Menu as MenuIcon,
        FileJson,
        Copy,
        Save
    } from 'lucide-svelte';

    let container: HTMLDivElement;
    let selectedNodeId = $state<string | null>(null);
    let selectedNodeName = $state<string>('');
    let maturity = $state<Record<string, CapabilityData>>({});
    let cy: cytoscape.Core;
    
    let isMenuOpen = $state(false);
    let searchQuery = $state('');
    let importInput: HTMLInputElement;
    let initialized = $state(false);

    // Dialog State
    let isDialogOpen = $state(false);
    let isQuestionnaireOpen = $state(false);
    let questionnaireAnswers = $state<Record<string, number>>({});
    let dialogTitle = $state('');
    let dialogStudyName = $state('');
    let dialogAction = $state<'create' | 'save_as' | 'clone'>('create');

    const selectedCapability = $derived(
        data.capabilities.find(c => c.id === selectedNodeId)
    );

    function handleQuestionnaireComplete() {
        if (selectedNodeId && selectedCapability?.questionnaire?.sections) {
            const subScores: Record<string, number> = {};
            
            selectedCapability.questionnaire.sections.forEach((section: any) => {
                let total = 0;
                let count = 0;
                section.questions.forEach((q: any) => {
                    if (questionnaireAnswers[q.id] !== undefined) {
                        total += (5 - questionnaireAnswers[q.id]) / 4;
                        count++;
                    }
                });
                
                if (count > 0) {
                    subScores[section.id] = Math.round((total / section.questions.length) * 100);
                }
            });

            if (Object.keys(subScores).length > 0) {
                const cap = maturity[selectedNodeId];
                if (!cap.subScores) cap.subScores = {};
                for (const [sid, score] of Object.entries(subScores)) {
                    cap.subScores[sid] = score;
                }
            }
            
            maturity[selectedNodeId].mode = 'manual';
        }
        isQuestionnaireOpen = false;
    }

    // Consolidated Maturity Scoring Logic
    $effect(() => {
        if (!initialized) return;

        // 1. Calculate Main Scores from Sub-scores (for MANUAL mode)
        for (const id in maturity) {
            const cap = maturity[id];
            if (cap.mode === 'manual' && cap.subScores && Object.keys(cap.subScores).length > 0) {
                const scores = Object.values(cap.subScores);
                const sorted = [...scores].sort((a, b) => a - b);
                const index = 0.25 * (sorted.length - 1);
                const lower = Math.floor(index);
                const upper = Math.ceil(index);
                const weight = index - lower;
                const finalScore = Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
                
                if (cap.score !== finalScore) {
                    untrack(() => {
                        maturity[id].score = finalScore;
                    });
                }
            }
        }

        // 3. PageRank-like propagation (for AUTO mode)
        if (cy) {
            const nodes = data.capabilities.map(c => c.id);
            const incoming = nodes.reduce((acc, id) => {
                acc[id] = cy.$id(id).incomers('node').map(n => n.id());
                return acc;
            }, {} as Record<string, string[]>);
            
            let currentScores = nodes.reduce((acc, id) => {
                acc[id] = maturity[id]?.score ?? 0;
                return acc;
            }, {} as Record<string, number>);

            const DAMPING = 0.85; 
            let changedAny = false;

            for (let i = 0; i < 10; i++) {
                let nextScores = { ...currentScores };
                let changedThisIter = false;
                
                for (const id of nodes) {
                    if (maturity[id]?.mode === 'auto') {
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
                        const newVal = Math.min(100, Math.round(avgParentScore * DAMPING));

                        if (nextScores[id] !== newVal) {
                            nextScores[id] = newVal;
                            changedThisIter = true;
                        }
                    }
                }
                currentScores = nextScores;
                if (!changedThisIter) break;
                changedAny = true;
            }

            if (changedAny) {
                untrack(() => {
                    for (const id of nodes) {
                        if (maturity[id].mode === 'auto' && maturity[id].score !== currentScores[id]) {
                            maturity[id].score = currentScores[id];
                        }
                    }
                });
            }
        }

        // 4. Auto-save
        const currentId = studyManager.currentStudyId;
        if (currentId) {
            const dataToSave = JSON.parse(JSON.stringify(maturity));
            untrack(() => {
                studyManager.updateStudy(currentId, dataToSave);
            });
        }
    });

    // Initialize maturity
    function resetMaturity() {
        const newMaturity: Record<string, CapabilityData> = {};
        data.capabilities.forEach(cap => {
            const capWithQuest = cap as any;
            const subScores: Record<string, number> = {};
            if (capWithQuest.questionnaire?.sections) {
                capWithQuest.questionnaire.sections.forEach((s: any) => {
                    subScores[s.id] = 0;
                });
            }
            newMaturity[cap.id] = { score: 0, mode: 'auto', subScores: Object.keys(subScores).length > 0 ? subScores : undefined };
        });
        maturity = newMaturity;
    }

    resetMaturity();

    function openNamingDialog(action: 'create' | 'save_as' | 'clone') {
        dialogAction = action;
        dialogStudyName = '';
        if (action === 'create') {
            dialogTitle = 'New Study';
        } else if (action === 'save_as') {
            dialogTitle = 'Save Study';
        } else if (action === 'clone') {
            const current = studyManager.studies.find(s => s.id === studyManager.currentStudyId);
            dialogStudyName = current ? `${current.name} (Copy)` : '';
            dialogTitle = 'Clone Study';
        }
        isDialogOpen = true;
    }

    function handleDialogSubmit() {
        if (!dialogStudyName) return;
        const dataToSave = JSON.parse(JSON.stringify(maturity));
        if (dialogAction === 'create') {
            resetMaturity();
            studyManager.createStudy(dialogStudyName, JSON.parse(JSON.stringify(maturity)));
        } else {
            studyManager.createStudy(dialogStudyName, dataToSave);
        }
        isDialogOpen = false;
    }

    function selectStudy(id: string) {
        const study = studyManager.studies.find(s => s.id === id);
        if (study) {
            maturity = JSON.parse(JSON.stringify(study.data));
            studyManager.currentStudyId = id;
        }
    }

    function resetToAnonymous() {
        resetMaturity();
        studyManager.currentStudyId = null;
    }

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

    const filteredStudies = $derived(
        studyManager.studies.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => b.updatedAt - a.updatedAt)
    );

    function getMaturityColor(value: number, faded = false) {
        let color = '#ef4444'; 
        if (value >= 25) color = '#f97316'; 
        if (value >= 50) color = '#f59e0b'; 
        if (value >= 75) color = '#22c55e'; 
        if (faded) {
            if (color === '#ef4444') return '#fee2e2'; 
            if (color === '#f97316') return '#ffedd5'; 
            if (color === '#f59e0b') return '#fef3c7'; 
            if (color === '#22c55e') return '#dcfce7'; 
        }
        return color;
    }

    function updateNodeStyle(nodeId: string, value: number, isSelected: boolean, mode: 'auto' | 'manual' = 'manual') {
        if (!cy) return;
        const node = cy.$id(nodeId);
        if (node) {
            const maturityColor = getMaturityColor(value);
            const progressColor = getMaturityColor(value, true);
            const borderWidth = isSelected ? 8 : 3;
            const borderStyle = mode === 'auto' ? 'dashed' : 'solid';
            node.style({
                'border-color': maturityColor,
                'border-width': borderWidth,
                'border-style': borderStyle,
                'background-gradient-stop-colors': `${progressColor} ${progressColor} #ffffff`,
                'background-gradient-stop-positions': `0% ${value}% ${value}%`
            } as any);
        }
    }

    onMount(() => {
        if (studyManager.currentStudyId) {
            const study = studyManager.studies.find(s => s.id === studyManager.currentStudyId);
            if (study) maturity = JSON.parse(JSON.stringify(study.data));
        }
        initialized = true;
        cytoscape.use(dagre);
        const elements = [
            ...data.capabilities.map((cap) => ({ data: { id: cap.id, label: cap.name } })),
            ...data.relationships.map((rel) => ({ data: { source: rel.source, target: rel.target } }))
        ];
        cy = cytoscape({
            container: container,
            elements: elements,
            style: [{
                selector: 'node',
                style: {
                    'background-color': '#ffffff',
                    'label': 'data(label)',
                    'color': '#334155',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'width': '160px',
                    'height': '50px',
                    'shape': 'round-rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': '140px',
                    'font-weight': '600',
                    'border-style': 'solid',
                    'border-width': 3,
                    'border-color': '#ef4444', 
                    'background-fill': 'linear-gradient',
                    'background-gradient-direction': 'to-right',
                    'background-gradient-stop-colors': '#fee2e2 #fee2e2 #ffffff',
                    'background-gradient-stop-positions': '0% 0% 0%',
                    'transition-property': 'border-color, background-gradient-stop-positions, border-width',
                    'transition-duration': 200
                } as any
            }, {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#cbd5e1',
                    'target-arrow-color': '#cbd5e1',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'opacity': 0.6
                }
            }],
            layout: { name: 'dagre', rankDir: 'LR', nodeSep: 60, rankSep: 120 } as any,
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            selectionType: 'single'
        });
        data.capabilities.forEach(cap => updateNodeStyle(cap.id, 0, false));
        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            selectedNodeId = node.id();
            selectedNodeName = node.data('label');
        });
        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                selectedNodeId = null;
                selectedNodeName = '';
            }
        });
        const handleResize = () => { cy.resize(); cy.fit(); };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cy.destroy();
        };
    });

    $effect(() => {
        if (cy) {
            const currentMaturity = maturity;
            const currentSelection = selectedNodeId;
            data.capabilities.forEach(cap => {
                const val = currentMaturity[cap.id]?.score ?? 0;
                const mode = currentMaturity[cap.id]?.mode ?? 'manual';
                const isSelected = cap.id === currentSelection;
                updateNodeStyle(cap.id, val, isSelected, mode);
            });
        }
    });
</script>

<svelte:head>
    <title>Boots - Maturity Map</title>
</svelte:head>

<div class="app-container">
    <div class="graph-container" bind:this={container}></div>

    <div class="top-bar">
        <button class="menu-button" onclick={() => isMenuOpen = !isMenuOpen} title="Manage Studies">
            <MenuIcon size={20} />
            <span>Studies</span>
        </button>
        {#if studyManager.currentStudyId}
            {@const currentStudy = studyManager.studies.find(s => s.id === studyManager.currentStudyId)}
            <div class="current-study-badge">
                <FileJson size={14} />
                <span>{currentStudy?.name}</span>
            </div>
        {/if}
    </div>

    {#if isMenuOpen}
        <div class="sidebar-overlay" onclick={() => isMenuOpen = false}></div>
        <div class="sidebar">
            <div class="sidebar-header">
                <h3>Studies</h3>
                <button class="icon-button" onclick={() => isMenuOpen = false}><X size={20} /></button>
            </div>
            <div class="sidebar-content">
                <div class="search-box">
                    <Search size={16} class="search-icon" />
                    <input type="text" class="search-input" bind:value={searchQuery} placeholder="Search studies..." />
                </div>
                <div class="action-group">
                    <button class="btn btn-primary" onclick={() => openNamingDialog('create')}><Plus size={16} /> New Study</button>
                    {#if studyManager.currentStudyId}
                        <button class="btn btn-secondary" onclick={() => openNamingDialog('clone')}><Copy size={16} /> Clone</button>
                        <button class="btn btn-ghost" onclick={resetToAnonymous}><X size={14} /> Close Study</button>
                    {:else}
                        <button class="btn btn-secondary" onclick={() => openNamingDialog('save_as')}><Save size={16} /> Save As...</button>
                    {/if}
                </div>
                <div class="section-label">Existing Studies</div>
                <div class="studies-list">
                    {#each filteredStudies as study}
                        <div class="study-item" class:active={study.id === studyManager.currentStudyId}>
                            <button class="study-select" onclick={() => selectStudy(study.id)}>
                                <span class="study-name">{study.name}</span>
                                <span class="study-date">{new Date(study.updatedAt).toLocaleDateString()}</span>
                            </button>
                            <div class="study-actions">
                                <button class="action-button" onclick={() => studyManager.exportStudy(study.id)}><Download size={14} /></button>
                                <button class="action-button delete-button" onclick={() => studyManager.deleteStudy(study.id)}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    {/each}
                    {#if filteredStudies.length === 0}<div class="empty-state">No studies found</div>{/if}
                </div>
            </div>
            <div class="sidebar-footer">
                <button class="btn btn-secondary full-width" onclick={() => importInput.click()}><Upload size={16} /> Import Studies</button>
                <input type="file" bind:this={importInput} onchange={handleImport} accept=".json" style="display: none" />
            </div>
        </div>
    {/if}

    <Dialog.Root bind:open={isDialogOpen}>
        <Dialog.Portal>
            <Dialog.Overlay class="dialog-overlay" />
            <Dialog.Content class="dialog-content">
                <Dialog.Title class="dialog-title">{dialogTitle}</Dialog.Title>
                <Dialog.Description class="dialog-description">Please enter a name for this study.</Dialog.Description>
                <div class="dialog-field">
                    <input type="text" class="input-field" bind:value={dialogStudyName} placeholder="Study name..." onkeydown={(e) => e.key === 'Enter' && handleDialogSubmit()} autofocus />
                </div>
                <div class="dialog-actions">
                    <Dialog.Close class="cancel-button">Cancel</Dialog.Close>
                    <button class="confirm-button" onclick={handleDialogSubmit} disabled={!dialogStudyName}>Confirm</button>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
    
    <Dialog.Root bind:open={isQuestionnaireOpen}>
        <Dialog.Portal>
            <Dialog.Overlay class="dialog-overlay" />
            <Dialog.Content class="dialog-content questionnaire-content">
                <div class="questionnaire-header">
                    <Dialog.Title class="dialog-title">Evaluate {selectedNodeName}</Dialog.Title>
                    <button class="icon-button" onclick={() => isQuestionnaireOpen = false}><X size={20} /></button>
                </div>
                <Dialog.Description class="dialog-description">Estimate maturity based on the following indicators.</Dialog.Description>
                <div class="questions-list">
                    {#if selectedCapability?.questionnaire?.sections}
                        {#each selectedCapability.questionnaire.sections as section}
                            <div class="question-section">
                                <h3 class="section-title">
                                    {section.name}
                                </h3>
                                <div class="section-questions">
                                    {#each section.questions as question}
                                        <div class="question-item">
                                            <p class="question-text">{question.text}</p>
                                            <div class="likert-scale">
                                                {#each [{ v: 1, l: 'Strongly Disagree' }, { v: 2, l: 'Disagree' }, { v: 3, l: 'Neutral' }, { v: 4, l: 'Agree' }, { v: 5, l: 'Strongly Agree' }] as opt}
                                                    <label class="likert-option" class:active={questionnaireAnswers[question.id] === opt.v}>
                                                        <input type="radio" name={question.id} value={opt.v} bind:group={questionnaireAnswers[question.id]} />
                                                        <span class="option-dot"></span>
                                                        <span class="option-label">{opt.l}</span>
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
                    <button class="cancel-button" onclick={() => isQuestionnaireOpen = false}>Cancel</button>
                    <button class="confirm-button" onclick={handleQuestionnaireComplete}>Apply Evaluation</button>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>

    <div class="floating-ui">
        {#if selectedNodeId}
            <div class="panel">
                <header>
                    <div class="title-group">
                        <span class="label">Capability</span>
                        <div class="name-row">
                            <h2>{selectedNodeName}</h2>
                            {#if selectedCapability?.questionnaire}
                                <button class="help-button" onclick={() => { questionnaireAnswers = {}; isQuestionnaireOpen = true; }} title="Help Evaluate">
                                    <Search size={12} />
                                    <span>Help Evaluate</span>
                                </button>
                            {/if}
                        </div>
                    </div>
                    <button class="close-panel" onclick={() => selectedNodeId = null}>&times;</button>
                </header>
                
                <div class="control-group">
                    <div class="mode-selector">
                        <button class:active={maturity[selectedNodeId]?.mode === 'manual'} onclick={() => { if (selectedNodeId) maturity[selectedNodeId].mode = 'manual'; }}>Manual</button>
                        <button class:active={maturity[selectedNodeId]?.mode === 'auto'} onclick={() => { if (selectedNodeId) maturity[selectedNodeId].mode = 'auto'; }}>Auto</button>
                    </div>

                    <div class="slider-header" class:disabled={maturity[selectedNodeId]?.mode === 'auto'}>
                        <span class="maturity-label">Evaluation</span>
                        <span class="maturity-value" style="color: {getMaturityColor(maturity[selectedNodeId]?.score ?? 0)}">
                            {maturity[selectedNodeId]?.score ?? 0}%
                        </span>
                    </div>
                    
                    <div class="main-score-progress">
                        <div class="progress-track">
                            <div class="progress-fill" style="width: {maturity[selectedNodeId]?.score ?? 0}%; background: {getMaturityColor(maturity[selectedNodeId]?.score ?? 0)}"></div>
                        </div>
                    </div>

                    <div class="slider-markers">
                        <span>Low</span>
                        <span>Elite</span>
                    </div>

                    {#if maturity[selectedNodeId]?.mode === 'manual' && selectedCapability?.questionnaire?.sections}
                        <div class="sub-capabilities-section">
                            <div class="section-label">Sub-capabilities</div>
                            <div class="sub-capabilities-list">
                                {#each selectedCapability.questionnaire.sections as section}
                                    <div class="sub-cap-item">
                                        <div class="sub-cap-header">
                                            <span class="sub-cap-name">{section.name}</span>
                                            <span class="sub-cap-value" style="color: {getMaturityColor(maturity[selectedNodeId]?.subScores?.[section.id] ?? 0)}">
                                                {maturity[selectedNodeId]?.subScores?.[section.id] ?? 0}%
                                            </span>
                                        </div>
                                        <Slider.Root
                                            type="multiple"
                                            value={[maturity[selectedNodeId]?.subScores?.[section.id] ?? 0]}
                                            onValueChange={(v: number[]) => {
                                                if (selectedNodeId && maturity[selectedNodeId].mode === 'manual') {
                                                    const cap = maturity[selectedNodeId];
                                                    if (!cap.subScores) cap.subScores = {};
                                                    cap.subScores[section.id] = v[0];
                                                }
                                            }}
                                            max={100}
                                            step={5}
                                            class="slider-root"
                                        >
                                            <div class="slider-track">
                                                <div class="slider-range" style="width: {maturity[selectedNodeId]?.subScores?.[section.id] ?? 0}%; background: {getMaturityColor(maturity[selectedNodeId]?.subScores?.[section.id] ?? 0)}"></div>
                                            </div>
                                            <Slider.Thumb index={0} class="slider-thumb" />
                                        </Slider.Root>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="welcome-badge">Select a capability to evaluate maturity</div>
        {/if}
    </div>

    <div class="legend">
        <div class="legend-item"><span class="dot" style="background: #ef4444"></span> Low (0-24%)</div>
        <div class="legend-item"><span class="dot" style="background: #f97316"></span> Medium (25-49%)</div>
        <div class="legend-item"><span class="dot" style="background: #f59e0b"></span> High (50-74%)</div>
        <div class="legend-item"><span class="dot" style="background: #22c55e"></span> Elite (75-100%)</div>
        <div class="legend-separator"></div>
        <div class="legend-item"><span class="box solid"></span> Manual Mode</div>
        <div class="legend-item"><span class="box dashed"></span> Auto (PageRank)</div>
    </div>
</div>

<style>
    .app-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
    .top-bar { position: absolute; top: 24px; left: 24px; display: flex; gap: 12px; align-items: center; z-index: 50; }
    .menu-button { @extend .btn; @extend .btn-secondary; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; gap: 8px; background: white; padding: 10px 16px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; color: #1e293b; border: 1px solid #e2e8f0; cursor: pointer; }
    .current-study-badge { display: flex; align-items: center; gap: 6px; background: #e2e8f0; padding: 10px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; color: #475569; border: 1px solid #cbd5e1; }
    .sidebar-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.2); backdrop-filter: blur(2px); z-index: 1000; }
    .sidebar { position: absolute; top: 0; left: 0; height: 100%; width: 360px; background: white; z-index: 1001; display: flex; flex-direction: column; box-shadow: 20px 0 25px -5px rgb(0 0 0 / 0.1); border-right: 1px solid #e2e8f0; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f1f5f9; }
    .sidebar-header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .sidebar-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .action-group { display: flex; flex-direction: column; gap: 10px; }
    .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-top: 12px; margin-bottom: -8px; }
    .studies-list { display: flex; flex-direction: column; gap: 8px; }
    .study-item { display: flex; align-items: center; gap: 8px; padding: 4px; border-radius: 8px; transition: background 0.2s; border: 1px solid transparent; }
    .study-item:hover { background: #f8fafc; }
    .study-item.active { background: #f1f5f9; border-color: #e2e8f0; }
    .study-select { flex: 1; display: flex; flex-direction: column; align-items: flex-start; background: none; border: none; padding: 8px; cursor: pointer; text-align: left; }
    .study-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
    .study-date { font-size: 0.75rem; color: #94a3b8; }
    .study-actions { display: flex; gap: 4px; align-items: center; }
    .action-button { padding: 8px; background: none; border: none; color: #94a3b8; cursor: pointer; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .action-button:hover { background: #e2e8f0; color: #475569; }
    .delete-button:hover { background: #fee2e2; color: #ef4444; }
    .sidebar-footer { padding: 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
    .icon-button { background: none; border: none; padding: 8px; cursor: pointer; color: #64748b; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .icon-button:hover { background: #f1f5f9; }
    .empty-state { text-align: center; padding: 20px; color: #94a3b8; font-size: 0.9rem; font-style: italic; }
    .graph-container { width: 100%; height: 100%; }
    .floating-ui { position: absolute; top: 24px; right: 24px; z-index: 100; pointer-events: none; }
    .panel { pointer-events: auto; width: 320px; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); padding: 24px; border: 1px solid #e2e8f0; max-height: calc(100vh - 48px); overflow-y: auto; }
    .main-score-progress { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; transition: all 0.3s ease; }
    .sub-capabilities-section { margin-top: 32px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
    .sub-capabilities-list { display: flex; flex-direction: column; gap: 20px; }
    .sub-cap-item { display: flex; flex-direction: column; gap: 8px; }
    .sub-cap-header { display: flex; justify-content: space-between; align-items: center; }
    .sub-cap-name { font-size: 0.75rem; font-weight: 600; color: #475569; }
    .sub-cap-value { font-size: 0.85rem; font-weight: 800; }
    .welcome-badge { background: white; padding: 10px 20px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: #64748b; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
    header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
    .name-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .help-button { display: flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 9999px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; cursor: pointer; transition: all 0.2s; }
    .help-button:hover { background: #dbeafe; }
    .close-panel { background: #f1f5f9; border: none; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; flex-shrink: 0; }
    :global(.questionnaire-content) {
        width: 700px !important;
        max-width: 95vw !important;
        max-height: 90vh !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    }

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
    .section-questions { display: flex; flex-direction: column; gap: 24px; }
    .question-item { display: flex; flex-direction: column; gap: 12px; }
    .question-text { font-weight: 600; color: #1e293b; margin: 0; font-size: 0.95rem; }
    .likert-scale { display: flex; justify-content: space-between; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
    .likert-option { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; position: relative; }
    .likert-option input { position: absolute; opacity: 0; cursor: pointer; }
    .option-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #cbd5e1; background: white; transition: all 0.2s; }
    .likert-option:hover .option-dot { border-color: #94a3b8; }
    .likert-option.active .option-dot { border-color: #3b82f6; background: #3b82f6; box-shadow: inset 0 0 0 3px white; }
    .option-label { font-size: 0.6rem; font-weight: 700; color: #94a3b8; text-align: center; text-transform: uppercase; max-width: 60px; line-height: 1.2; }
    .likert-option.active .option-label { color: #3b82f6; }
    .slider-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .maturity-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .maturity-value { font-size: 1.1rem; font-weight: 800; }
    .mode-selector { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; margin-bottom: 20px; }
    .mode-selector button { flex: 1; border: none; background: none; padding: 6px; font-size: 0.75rem; font-weight: 600; color: #64748b; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .mode-selector button.active { background: white; color: #1e293b; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
    .slider-header.disabled { opacity: 0.5; }
    .slider-markers { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.6rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .legend { position: absolute; bottom: 24px; left: 24px; background: white; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .legend-item { display: flex; align-items: center; font-size: 0.7rem; font-weight: 600; color: #64748b; }
    .dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
    .legend-separator { height: 1px; background: #f1f5f9; margin: 4px 0; }
    .box { width: 12px; height: 12px; margin-right: 8px; border: 2px solid #cbd5e1; border-radius: 3px; }
    .box.solid { border-style: solid; }
    .box.dashed { border-style: dashed; }
    .dialog-field { margin-top: 8px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
</style>
