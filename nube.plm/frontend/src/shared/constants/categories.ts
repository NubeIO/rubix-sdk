export const CATEGORIES = [
  { id: 'hardware', name: 'Hardware', description: 'PCB, IO, power, enclosure' },
  { id: 'firmware', name: 'Firmware', description: 'Device logic, comms, protocols' },
  { id: 'software', name: 'Software', description: 'UI, APIs, data, desktop/mobile apps' },
  { id: 'cloud', name: 'Cloud', description: 'Telemetry, pipelines, access control, infrastructure' },
  { id: 'testing', name: 'Testing', description: 'Functional, stress, field validation' },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, suppliers, production, QA' },
  { id: 'compliance', name: 'Compliance', description: 'CE, FCC, RCM, standards' },
  { id: 'operations', name: 'Operations', description: 'Support, documentation, internal handover' },
  { id: 'gtm', name: 'GTM', description: 'Pricing, sales tools, partners, launch' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
