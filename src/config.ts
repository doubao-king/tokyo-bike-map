import type { ComfortClass } from './types';

export const comfortClasses: ComfortClass[] = ['A', 'B', 'C', 'D'];

export const classUrlValues: Record<ComfortClass, string> = {
  A: 'separated',
  B: 'paths',
  C: 'lanes',
  D: 'mixed'
};

export const defaultVisibleClasses = new Set<ComfortClass>(['A', 'B', 'C']);

export const classMeta: Record<ComfortClass, { color: string; label: string; description: string }> = {
  A: { color: '#007a5e', label: '車と分離された走りやすい道', description: '車と物理分離' },
  B: { color: '#67a51f', label: '歩道・緑道などの走りやすい道', description: '広い歩道内・緑道・河川敷' },
  C: { color: '#d98a00', label: '自転車レーン', description: '車道上の専用レーン' },
  D: { color: '#d63b2f', label: '車道混在', description: 'ナビライン・車道混在' }
};

export const areaTargets = [
  { id: 'ikebukuro-otsuka', label: '池袋・大塚', group: '23区 北・西', center: [35.7298, 139.7143] as [number, number], zoom: 14 },
  { id: 'kanamecho-senkawa', label: '要町・千川', group: '23区 北・西', center: [35.7381, 139.6892] as [number, number], zoom: 14 },
  { id: 'sugamo-oji', label: '巣鴨・西ケ原・王子', group: '23区 北・西', center: [35.7482, 139.7382] as [number, number], zoom: 13 },
  { id: 'bunkyo', label: '文京', group: '23区 北・西', center: [35.7165, 139.7434] as [number, number], zoom: 14 },
  { id: 'imperial-chiyoda', label: '皇居・千代田', group: '23区 都心', center: [35.6853, 139.7528] as [number, number], zoom: 14 },
  { id: 'yotsuya-gaien', label: '四谷・神宮外苑', group: '23区 都心', center: [35.6811, 139.7208] as [number, number], zoom: 14 },
  { id: 'aoyama-akasaka', label: '青山・乃木坂・赤坂', group: '23区 都心', center: [35.6714, 139.7284] as [number, number], zoom: 14 },
  { id: 'shiba-takeshiba', label: '芝・竹芝', group: '23区 南・湾岸', center: [35.6541, 139.7547] as [number, number], zoom: 14 },
  { id: 'toyosu-odaiba', label: '豊洲・有明・お台場', group: '23区 南・湾岸', center: [35.6358, 139.7875] as [number, number], zoom: 13 },
  { id: 'shinkiba-yumenoshima', label: '新木場・夢の島', group: '23区 南・湾岸', center: [35.6482, 139.8267] as [number, number], zoom: 14 },
  { id: 'arakawa', label: '荒川・葛西橋', group: '23区 河川', center: [35.6915, 139.8445] as [number, number], zoom: 13 },
  { id: 'musashino-mitaka', label: '武蔵野・三鷹', group: '多摩 東部', center: [35.6995, 139.5595] as [number, number], zoom: 13 },
  { id: 'chofu-fuchu', label: '調布・府中', group: '多摩 東部', center: [35.666, 139.506] as [number, number], zoom: 13 },
  { id: 'koganei-kokubunji', label: '小金井・国分寺', group: '多摩 東部', center: [35.705, 139.477] as [number, number], zoom: 13 },
  { id: 'tachikawa-akishima', label: '立川・昭島', group: '多摩 西部', center: [35.703, 139.39] as [number, number], zoom: 13 },
  { id: 'tama-machida', label: '多摩・町田', group: '多摩 西部', center: [35.618, 139.425] as [number, number], zoom: 12 },
  { id: 'hachioji', label: '八王子', group: '多摩 西部', center: [35.666, 139.316] as [number, number], zoom: 12 },
  { id: 'ome-okutama', label: '青梅・奥多摩', group: '多摩 西部', center: [35.786, 139.174] as [number, number], zoom: 11 },
  { id: 'izu-oshima', label: '伊豆大島', group: '島しょ', center: [34.737, 139.4] as [number, number], zoom: 11 }
] as const;

export const tokyoInitialView = {
  center: [35.69, 139.52] as [number, number],
  zoom: 10
};
