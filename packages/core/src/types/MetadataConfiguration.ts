export interface MetadataConfiguration {
  fieldTypes: readonly string[]
  extendedProperties: object
  slotProperties: object
  extendedSettingsProperties: object
  valueTypes: Record<string, any>
}
