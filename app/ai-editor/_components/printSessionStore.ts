/**
 * Saved Print Studio layouts.
 *
 * Photos are stored as data URLs (large), so localStorage would overflow. We use
 * IndexedDB with two stores: a light "meta" store (what the list shows) and a
 * heavy "data" store (the full layout, read only when a layout is opened).
 * Everything stays in this browser on this device.
 */
export type PrintSessionItem = {
    id: string;
    label: string;
    widthMm: number;
    heightMm: number;
    xMm: number;
    yMm: number;
    rotation: number;
    image: string;
    page: number;
    sourceKey?: string;
};
export type PrintSessionSnapshot = {
    pageSizeKey: string;
    orientation: "portrait" | "landscape";
    hAlign: "left" | "center" | "right";
    autoLayout: boolean;
    gapMm: number;
    marginMm: number;
    cuttingBorder: boolean;
    cutStyle: "dashed" | "solid" | "marks";
    cutMm: number;
    imageBorder: boolean;
    imageBorderMm: number;
    imageBorderColor: string;
    items: PrintSessionItem[];
};
export type PrintSessionMeta = {
    id: string;
    createdAt: number;
    updatedAt: number;
    photoCount: number;
    pageCount: number;
    pageSizeKey: string;
    thumbs: string[];
};

const DB_NAME = "sebalagbe-ai-editor-print";
const DB_VERSION = 1;
const META_STORE = "meta";
const DATA_STORE = "data";
/** Oldest layouts are removed beyond this many so the browser storage never fills up. */
export const MAX_SAVED_SESSIONS = 12;

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("এই ব্রাউজারে সংরক্ষণ সুবিধা নেই।"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(META_STORE))
                db.createObjectStore(META_STORE, { keyPath: "id" });
            if (!db.objectStoreNames.contains(DATA_STORE))
                db.createObjectStore(DATA_STORE, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("সংরক্ষণ ডাটাবেস খোলা যায়নি।"));
        request.onblocked = () => reject(new Error("সংরক্ষণ ডাটাবেস ব্লকড। অন্য ট্যাব বন্ধ করে আবার চেষ্টা করুন।"));
    });
}
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
function transactionDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("সংরক্ষণ করা যায়নি।"));
        tx.onabort = () => reject(tx.error ?? new Error("সংরক্ষণ করা যায়নি (জায়গা শেষ হয়ে যেতে পারে)।"));
    });
}
function newId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
        return crypto.randomUUID();
    return `print-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function makeThumbnail(src: string, maxSide = 160): Promise<string> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            try {
                const sw = image.naturalWidth || image.width;
                const sh = image.naturalHeight || image.height;
                if (!sw || !sh) {
                    resolve("");
                    return;
                }
                const scale = Math.min(1, maxSide / Math.max(sw, sh));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(sw * scale));
                canvas.height = Math.max(1, Math.round(sh * scale));
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve("");
                    return;
                }
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                const out = canvas.toDataURL("image/jpeg", 0.7);
                canvas.width = 0;
                canvas.height = 0;
                resolve(out);
            }
            catch {
                resolve("");
            }
            finally {
                image.onload = null;
                image.onerror = null;
                image.src = "";
            }
        };
        image.onerror = () => resolve("");
        image.src = src;
    });
}

export async function listPrintSessions(): Promise<PrintSessionMeta[]> {
    const db = await openDb();
    try {
        const tx = db.transaction(META_STORE, "readonly");
        const all = await requestToPromise(tx.objectStore(META_STORE).getAll() as IDBRequest<PrintSessionMeta[]>);
        return all.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    finally {
        db.close();
    }
}
export async function getPrintSession(id: string): Promise<PrintSessionSnapshot | null> {
    const db = await openDb();
    try {
        const tx = db.transaction(DATA_STORE, "readonly");
        const record = await requestToPromise(tx.objectStore(DATA_STORE).get(id) as IDBRequest<{
            id: string;
            snapshot: PrintSessionSnapshot;
        } | undefined>);
        return record?.snapshot ?? null;
    }
    finally {
        db.close();
    }
}
/** Saves a layout. Pass `existingId` to update the layout that was opened. Returns its id. */
export async function savePrintSession(snapshot: PrintSessionSnapshot, existingId?: string | null): Promise<string> {
    if (!snapshot.items.length)
        throw new Error("সংরক্ষণ করার মতো কোনো ছবি নেই।");
    const uniqueImages = Array.from(new Set(snapshot.items.map((item) => item.image)));
    const thumbs = (await Promise.all(uniqueImages.slice(0, 4).map((src) => makeThumbnail(src)))).filter(Boolean);
    const db = await openDb();
    try {
        const readTx = db.transaction(META_STORE, "readonly");
        const existingMeta = existingId
            ? await requestToPromise(readTx.objectStore(META_STORE).get(existingId) as IDBRequest<PrintSessionMeta | undefined>)
            : undefined;
        const id = existingMeta ? existingMeta.id : newId();
        const now = Date.now();
        const pageCount = new Set(snapshot.items.map((item) => item.page ?? 0)).size;
        const meta: PrintSessionMeta = {
            id,
            createdAt: existingMeta?.createdAt ?? now,
            updatedAt: now,
            photoCount: snapshot.items.length,
            pageCount,
            pageSizeKey: snapshot.pageSizeKey,
            thumbs,
        };
        const tx = db.transaction([META_STORE, DATA_STORE], "readwrite");
        tx.objectStore(META_STORE).put(meta);
        tx.objectStore(DATA_STORE).put({ id, snapshot });
        await transactionDone(tx);
        // Trim the oldest layouts beyond the limit.
        const trimTx = db.transaction([META_STORE, DATA_STORE], "readwrite");
        const metas = (await requestToPromise(trimTx.objectStore(META_STORE).getAll() as IDBRequest<PrintSessionMeta[]>))
            .sort((a, b) => b.updatedAt - a.updatedAt);
        metas.slice(MAX_SAVED_SESSIONS).forEach((old) => {
            trimTx.objectStore(META_STORE).delete(old.id);
            trimTx.objectStore(DATA_STORE).delete(old.id);
        });
        await transactionDone(trimTx);
        return id;
    }
    finally {
        db.close();
    }
}
export async function deletePrintSession(id: string): Promise<void> {
    const db = await openDb();
    try {
        const tx = db.transaction([META_STORE, DATA_STORE], "readwrite");
        tx.objectStore(META_STORE).delete(id);
        tx.objectStore(DATA_STORE).delete(id);
        await transactionDone(tx);
    }
    finally {
        db.close();
    }
}
