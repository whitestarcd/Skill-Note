/**
 * 存储服务 - 使用 IndexedDB 持久化数据
 */

import { openDB, IDBPDatabase } from 'idb';
import { SkillNoteData } from '../models';

const DB_NAME = 'skill-note-db';
const DB_VERSION = 1;
const STORE_NAME = 'skill-data';

let db: IDBPDatabase | null = null;

/**
 * 初始化数据库
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });

  return db;
}

/**
 * 保存数据
 */
export async function saveData(data: SkillNoteData): Promise<void> {
  const database = await initDB();
  await database.put(STORE_NAME, { id: 'main', ...data });
}

/**
 * 加载数据
 */
export async function loadData(): Promise<SkillNoteData | null> {
  const database = await initDB();
  const result = await database.get(STORE_NAME, 'main');

  if (!result) return null;

  return {
    version: result.version,
    exportDate: result.exportDate,
    documents: result.documents || result.topics || [],
    categories: result.categories || [],
    skills: result.skills || [],
  };
}

/**
 * 清空数据
 */
export async function clearData(): Promise<void> {
  const database = await initDB();
  await database.delete(STORE_NAME, 'main');
}

/**
 * 导出为 JSON 文件
 */
export function exportToFile(data: SkillNoteData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skill-note-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入
 */
export function importFromFile(file: File): Promise<SkillNoteData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !(data.documents || data.topics) || !data.categories || !data.skills) {
          throw new Error('Invalid file format');
        }
        resolve(data as SkillNoteData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
