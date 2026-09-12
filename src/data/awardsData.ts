export interface Award {
  id: string
  title: string
  org: string
  year: string
  description: string
  /** Visual tier used by AwardsSection for border styling. */
  tier: 'gold' | 'silver' | 'academic'
}

export const awardsData: Award[] = [
  {
    id: 'hackhive',
    title: '$2,000 Prize — HackHive',
    org: 'HackHive',
    year: '2025',
    description:
      'Won a $2,000 prize at HackHive for MedSafe AI, a real-time hospital violence detection system using computer vision and audio analysis to alert security staff automatically.',
    tier: 'gold',
  },
  {
    id: 'ops-competition',
    title: '1st Place — OPS Case Competition',
    org: 'Ontario Public Service',
    year: '2023',
    description:
      'Won first place in the Ontario Public Service case competition for designing a citizen-facing digital service prototype addressing government transformation challenges.',
    tier: 'gold',
  },
  {
    id: 'hackathon',
    title: 'Hackathon Achievement',
    org: 'Ontario Tech University',
    year: '2023',
    description:
      'Recognized for outstanding technical innovation and teamwork at a university-level hackathon event.',
    tier: 'silver',
  },
  {
    id: 'dean-list',
    title: "Dean's List",
    org: 'Ontario Tech University',
    year: '2022–2024',
    description:
      "Recognized on the Dean's List for academic excellence across multiple semesters in the Computer Science program.",
    tier: 'academic',
  },
]
