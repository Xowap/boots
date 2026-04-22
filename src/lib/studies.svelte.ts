
import { browser } from '$app/environment';

export interface CapabilityData {
    score: number;
    // Ready for more properties in the future
}

export interface Study {
    id: string;
    name: string;
    updatedAt: number;
    data: Record<string, CapabilityData>;
}

class StudyManager {
    studies = $state<Study[]>([]);
    currentStudyId = $state<string | null>(null);

    constructor() {
        if (browser) {
            this.loadFromLocalStorage();
        }
    }

    private migrateStudy(study: any): Study {
        if (!study.data) return study;
        
        const migratedData: Record<string, CapabilityData> = {};
        for (const [key, value] of Object.entries(study.data)) {
            if (typeof value === 'number') {
                migratedData[key] = { score: value };
            } else {
                migratedData[key] = value as CapabilityData;
            }
        }
        
        return {
            ...study,
            data: migratedData
        };
    }

    private loadFromLocalStorage() {
        const saved = localStorage.getItem('boots-studies');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.studies = parsed.map((s: any) => this.migrateStudy(s));
            } catch (e) {
                console.error('Failed to parse studies from localStorage', e);
                this.studies = [];
            }
        }
        
        const lastId = localStorage.getItem('boots-current-study-id');
        this.currentStudyId = lastId;
    }

    private saveToLocalStorage() {
        if (browser) {
            // Use deep clone to completely strip proxies before stringify
            localStorage.setItem('boots-studies', JSON.stringify(this.studies));
            if (this.currentStudyId) {
                localStorage.setItem('boots-current-study-id', this.currentStudyId);
            } else {
                localStorage.removeItem('boots-current-study-id');
            }
        }
    }

    createStudy(name: string, data: Record<string, CapabilityData>) {
        const newStudy: Study = {
            id: crypto.randomUUID(),
            name,
            updatedAt: Date.now(),
            data: JSON.parse(JSON.stringify(data))
        };
        this.studies.push(newStudy);
        this.currentStudyId = newStudy.id;
        this.saveToLocalStorage();
        return newStudy;
    }

    updateStudy(id: string, data: Record<string, CapabilityData>) {
        const index = this.studies.findIndex(s => s.id === id);
        if (index !== -1) {
            this.studies[index].data = JSON.parse(JSON.stringify(data));
            this.studies[index].updatedAt = Date.now();
            this.saveToLocalStorage();
        }
    }

    renameStudy(id: string, newName: string) {
        const index = this.studies.findIndex(s => s.id === id);
        if (index !== -1) {
            this.studies[index].name = newName;
            this.studies[index].updatedAt = Date.now();
            this.saveToLocalStorage();
        }
    }

    deleteStudy(id: string) {
        this.studies = this.studies.filter(s => s.id !== id);
        if (this.currentStudyId === id) {
            this.currentStudyId = null;
        }
        this.saveToLocalStorage();
    }

    exportStudy(id: string) {
        const study = this.studies.find(s => s.id === id);
        if (!study) return;
        
        // Export as an array to be consistent with import format
        const data = JSON.stringify([study], null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = study.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        a.download = `boots-study-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importStudies(json: string) {
        try {
            const imported = JSON.parse(json);
            if (Array.isArray(imported)) {
                // Basic validation and migration
                const valid = imported
                    .filter(s => s.id && s.name && s.data)
                    .map(s => this.migrateStudy(s));
                    
                this.studies = [...this.studies, ...valid];
                // Remove duplicates by ID if any
                this.studies = Array.from(new Map(this.studies.map(s => [s.id, s])).values());
                this.saveToLocalStorage();
            }
        } catch (e) {
            console.error('Failed to import studies', e);
            throw new Error('Invalid JSON format');
        }
    }
}

export const studyManager = new StudyManager();
