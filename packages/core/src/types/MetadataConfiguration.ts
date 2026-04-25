export interface MetadataConfiguration {
  fieldTypes: readonly string[]
  extendedProperties: object
  slotProperties: object
  valueTypes: Record<string, any>
}
