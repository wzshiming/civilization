/**
 * Simplified Chinese translations (简体中文)
 */

import type { TerrainType, ResourceType } from '../../types/map';
import type { TranslationKeys } from './en';

export const zhCN: TranslationKeys = {
  // App level
  loadingMap: '正在生成世界地图...',
  mapGenerationFailed: '地图生成失败',
  
  // Control Panel
  simulation: '模拟',
  pause: '⏸ 暂停',
  start: '▶ 开始',
  speed: '速度',
  closeConfig: '✕ 关闭配置',
  mapConfig: '⚙ 地图配置',
  numberOfParcels: '地块数量：',
  seedOptional: '种子（可选）：',
  random: '随机',
  regenerateMap: '🔄 重新生成地图',
  
  // Parcel Detail Panel
  parcel: '地块',
  terrain: '地形',
  type: '类型：',
  elevation: '海拔：',
  moisture: '湿度：',
  temperature: '温度：',
  resources: '资源',
  noResources: '无可用资源',
  location: '位置',
  center: '中心：',
  neighbors: '邻居：',
  
  // Terrain types
  terrainTypes: {
    ocean: '海洋',
    shallow_water: '浅水',
    beach: '海滩',
    grassland: '草原',
    forest: '森林',
    jungle: '丛林',
    desert: '沙漠',
    tundra: '冻土',
    mountain: '山地',
    snow: '雪地',
    river: '河流',
  } as Record<TerrainType, string>,
  
  // Resource types
  resourceTypes: {
    water: '水',
    wood: '木材',
    stone: '石料',
    iron: '铁',
    gold: '金',
    oil: '石油',
    coal: '煤',
    fertile_soil: '肥沃土壤',
    fish: '鱼',
    game: '猎物',
  } as Record<ResourceType, string>,
  
  // Language selector
  language: '语言',
};
