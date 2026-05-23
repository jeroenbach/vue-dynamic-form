import type { DynamicFormSettings } from './DynamicFormSettings';
import type { MetadataConfiguration } from '@/types/MetadataConfiguration';

export type GetDynamicFormSettingsType<T extends MetadataConfiguration> = DynamicFormSettings<T['extendedSettingsProperties']>;
