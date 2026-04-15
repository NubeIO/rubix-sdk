export const PLM_NODE_TYPES = {
  SERVICE: 'plm.service',
  PRODUCT: 'plm.product',
  MANUFACTURING_RUN: 'plm.manufacturing-run',
  PRODUCTION_RUN: 'plm.manufacturing-run',
  SERIALIZED_UNIT: 'core.asset',
  WORK_ITEM: 'plm.work-item',
  DEPLOYMENT: 'plm.deployment',
  SITE: 'plm.site',
} as const;

export const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
