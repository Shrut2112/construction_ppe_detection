const API_URL = 'http://localhost:8000';

export interface Violation {
    id: number;
    worker_id: string;
    worker_name?: string;
    equipped_items: string;
    violated_items: string;
    evidence_path: string;
    timestamp: string;
}

export interface Worker {
    id: string;
    display_name: string;
    created_at: string;
}

export interface Stats {
    total_workers: number;
    helmet_count: number;
    vest_count: number;
    mask_count: number;
    violations_today: number;
}

export async function fetchViolations(): Promise<Violation[]> {
    const res = await fetch(`${API_URL}/violations`);
    if (!res.ok) throw new Error('Failed to fetch violations');
    return res.json();
}

export async function fetchStats(): Promise<Stats> {
    const res = await fetch(`${API_URL}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function uploadVideo(file: File): Promise<{ filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}
