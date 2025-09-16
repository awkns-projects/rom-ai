// Main template exports
export { default as MobileAppTemplate } from './MobileAppTemplate';
export { MobileAppTemplateBase, type MobileAppTemplateOptions, type TemplateGenerator } from './base/MobileAppTemplateBase';

// Individual generator exports (for advanced usage)
export { ConfigGenerator } from './generators/ConfigGenerator';
export { PageGenerator } from './generators/PageGenerator';
export { ComponentGenerator } from './generators/ComponentGenerator';
export { ApiGenerator } from './generators/ApiGenerator';
export { UtilityGenerator } from './generators/UtilityGenerator';

// Utility exports
export { normalizeSchedule, escapeJSString } from './base/MobileAppTemplateBase'; 