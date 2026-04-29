export interface Experience {
  id: string
  role: string
  org: string
  orgFull: string
  type: string
  dates: string
  location: string
  description: string
  highlights: string[]
  tech: string[]
  logo?: string
}

export const experienceData: Experience[] = [
  {
    id: 'ops-govtechon',
    role: 'Software Developer / QA Co-op',
    org: 'OPS / GovTechON',
    orgFull: 'Ontario Public Service — GovTechON',
    type: 'Co-op',
    dates: 'Jan 2024 – Aug 2024',
    location: 'Toronto, ON',
    description:
      'Worked as a software developer and QA engineer within the Government of Ontario\'s digital innovation unit, building and testing citizen-facing services.',
    highlights: [
      'Developed and maintained automated test suites using Python and Azure DevOps pipelines',
      'Identified and documented critical defects in government-grade web applications',
      'Collaborated cross-functionally with product, design, and development teams',
      'Contributed to CI/CD pipeline improvements that reduced regression time by 30%',
    ],
    tech: ['Python', 'Azure DevOps', 'JavaScript', 'GitHub', 'Testing', 'CI/CD'],
  },
  {
    id: 'lee-language-lab',
    role: 'Product Manager & AI/NLP Researcher',
    org: 'Lee Language Lab',
    orgFull: 'Lee Language Lab — Ontario Tech University',
    type: 'Research',
    dates: 'Sep 2023 – Dec 2023',
    location: 'Oshawa, ON',
    description:
      'Led product management and contributed to AI/NLP research for language learning tools within Ontario Tech\'s academic language research lab.',
    highlights: [
      'Managed product roadmap, sprint planning, and stakeholder communications',
      'Built NLP data pipelines to process and analyze language acquisition datasets',
      'Presented research findings to faculty and external academic collaborators',
      'Designed user-facing features for AI-assisted language learning tools',
    ],
    tech: ['Python', 'NLP', 'Data Pipelines', 'Product Management', 'Research'],
  },
]
