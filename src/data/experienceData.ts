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
    role: 'Software Engineer',
    org: 'Ontario Public Service',
    orgFull: 'Ontario Public Service',
    type: 'Co-op',
    dates: 'Jan 2026 – Present',
    location: 'Toronto',
    description:
      '',
    highlights: [
      'Reduced post-release defect escape rate by executing 40+ UAT test cases per release across enterprise financial systems serving the Ontario Ministry of Finance',
      'Accelerated engineering fix cycles by triaging 30+ defects per release and translating user-facing failures into prioritized Azure DevOps bug reports',
      'Ensured 100% audit compliance by maintaining full requirements-to-evidence traceability in SharePoint documentation across iterative releases',
    ],
    tech: ['Azure DevOps', 'SharePoint', 'Testing', 'UAT', 'Requirements Traceability', 'QA'],
  },
  {
    id: 'lee-language-lab',
    role: 'Associate Product Manager',
    org: 'University of Toronto',
    orgFull: 'University of Toronto',
    type: 'Research',
    dates: 'May 2025 – Aug 2025',
    location: 'Toronto',
    description:
      '',
    highlights: [
      'Increased Lee Language Lab research output by 20% by owning the end-to-end roadmap for 2 NLP and AI products.',
      'Secured NSERC Discovery and Supplementary grant funding by translating complex technical research into compelling narratives for non-technical reviewers and institutional stakeholders',
      'Eliminated the lab web presence gap by defining requirements and launching the official lab website, reducing onboarding friction and shipping 3 peer-reviewed publications on deadline',
    ],
    tech: ['Product Management', 'NLP', 'AI', 'Agile / Scrum', 'Roadmapping', 'User Stories'],
  },
  {
    id: 'brilliant-catalyst',
    role: 'Data Analyst',
    org: 'Brilliant Catalyst',
    orgFull: 'Brilliant Catalyst',
    type: 'Co-op',
    dates: 'Jan 2025 – Apr 2025',
    location: 'Oshawa',
    description:
      '',
    highlights: [
      'Improved team efficiency by 25% by building and deploying 3 automated reporting tools across the organization',
      'Surfaced actionable product insights from 325 student users across multiple ideathons and delivered findings to inform program strategy',
      'Mentored 4 junior analysts in SQL and Python, reducing average report turnaround time and increasing independent analytical output',
    ],
    tech: ['SQL', 'Python', 'Data Analysis', 'Reporting Automation', 'Git', 'Linux'],
  },
  {
    id: 'ontario-tech',
    role: 'Bachelor of Science — Computer Science (Co-op)',
    org: 'Ontario Tech',
    orgFull: 'Ontario Tech University',
    type: 'Education',
    dates: 'Sep 2023 – Present',
    location: 'Oshawa, ON',
    description:
      'Computer Science co-op student with focus areas in software engineering, AI/ML and product development.',
    highlights: [
      "Dean's List — academic excellence across multiple semesters",
      '1st Place, OPS Case Competition (2023)',
      'Hackathon Achievement (2023)',
    ],
    tech: ['Java', 'Python', 'Data Structures', 'Algorithms', 'Operating Systems', 'Networking'],
  },
]
