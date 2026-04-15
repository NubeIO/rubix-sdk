export const GATES = [
  { id: 'g1', name: 'Executive Summary', description: 'Define the problem, solution intent, and confirm strategic and commercial alignment.' },
  { id: 'g2', name: 'Proof of Concept', description: 'Validate the core concept and confirm the solution is technically viable.' },
  { id: 'g3', name: 'MVP (Build)', description: 'Develop an end-to-end working version with core functionality integrated.' },
  { id: 'g4', name: 'Client Acceptance', description: 'Deploy to a live environment and confirm the solution meets real-world requirements.' },
  { id: 'g5', name: 'Product Refinement', description: 'Resolve issues, stabilise performance, and lock the design for scale.' },
  { id: 'g6', name: 'Production Ready', description: 'Ensure the product is fully ready for manufacturing, compliance, and internal delivery.' },
  { id: 'g7', name: 'Go-To-Market', description: 'Prepare, launch, and enable sales to drive initial market adoption.' },
  { id: 'g8', name: 'Scale & Support', description: 'Operate, support, and continuously improve the product as it scales in market.' },
] as const;

export type GateId = typeof GATES[number]['id'];
