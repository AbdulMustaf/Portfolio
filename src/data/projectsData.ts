export interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  tags: string[]
  image: string
  githubUrl?: string
  liveUrl?: string
  featured?: boolean
  year: string
}

export const projectsData: Project[] = [
  {
    id: 'sts-phase-detector',
    title: 'A Phase Detector Is Not a Clock',
    subtitle: 'Sit-to-stand phase detection + a prespecified movement-control index',
    description:
      'A two-part study on the 5-repetition sit-to-stand test: a four-class phase detector on wearable kinematics, and proof that the same labels cannot be used as a measurement of time.',
    longDescription:
      'Part I trains a subject-independent four-class phase detector (sitting / rising / standing / lowering) on 100 Hz full-body kinematics from 32 adults, reaching macro-F1 0.735 strict and 0.852 at ±100 ms boundary tolerance under participant-grouped cross-validation — with a single pelvis sensor matching the full seven-sensor array to within 0.002. Part II shows the detector\'s ±175 ms anchor convention makes every standing dwell exactly 0.370 s against a measured 0.030 s; re-segmenting on velocity gates recovers 320/320 repetitions and lifts the same feature from ICC 0.334 to 0.726, enabling the RisingControlIndex — a prespecified, unfitted score separating age groups at AUC 0.771 (permutation p = 0.0033) and replicating 4/4 in an independent Parkinson\'s cohort. The project also retracts an earlier 0.867 result of my own, computing the ablation that collapses it to 0.100.',
    tags: [
      'Python',
      'Scikit-learn',
      'PyTorch',
      'SciPy',
      'Time-Series',
      'Signal Processing',
      'Biomechanics',
      'Statistics',
      'Research',
      'LaTeX',
    ],
    image: '',
    featured: true,
    year: '2026',
  },
  {
    id: 'ai-compliance-guard',
    title: 'AI Compliance Guard',
    subtitle: 'AI-powered regulatory compliance automation',
    description:
      'An AI-driven tool that automatically flags regulatory compliance issues in documents using NLP and fine-tuned language models.',
    longDescription:
      'AI Compliance Guard uses large language models and NLP pipelines to scan, analyze, and flag regulatory compliance gaps in legal and government documents. Built with Python, Flask, and Azure cognitive services.',
    tags: ['Python', 'Flask', 'NLP', 'Azure', 'AI', 'LLM'],
    image: '/images/project-ai-compliance.jpg',
    githubUrl: 'https://github.com/abdullahmustafa/ai-compliance-guard',
    featured: true,
    year: '2024',
  },
  {
    id: 'pixel-zero',
    title: 'Pixel Zero',
    subtitle: 'AI-generated media detection platform',
    description:
      'A web platform that detects AI-generated images, deepfakes, and synthetic media using computer vision and ML classifiers.',
    longDescription:
      'Pixel Zero tackles the growing problem of synthetic media by providing a fast, accurate detection pipeline. Uses PyTorch-based vision models served through a React frontend and Flask API.',
    tags: ['Python', 'PyTorch', 'React', 'Computer Vision', 'Flask', 'ML'],
    image: '/images/project-pixel-zero.jpg',
    githubUrl: 'https://github.com/abdullahmustafa/pixel-zero',
    featured: true,
    year: '2024',
  },
  {
    id: 'ops-case-competition',
    title: 'OPS Case Competition',
    subtitle: '1st Place — Government Digital Transformation',
    description:
      'Winning solution for the Ontario Public Service case competition focused on digital transformation and citizen-facing service design.',
    longDescription:
      'Led a team to a first-place finish in the OPS case competition by designing a citizen-facing digital service prototype using human-centered design principles. Presented to senior government stakeholders.',
    tags: ['Product Design', 'UX', 'Government Tech', 'Strategy'],
    image: '/images/project-ops-competition.jpg',
    featured: false,
    year: '2023',
  },
  {
    id: 'lee-language-lab',
    title: 'Lee Language Lab — NLP Research',
    subtitle: 'AI/NLP research platform for language learning',
    description:
      'Product management and NLP research for an academic language lab, building AI-assisted tools for language learning analysis.',
    longDescription:
      'Managed product roadmap and contributed to NLP model development at the Lee Language Lab. Built data pipelines and analysis tools to support academic research into language acquisition patterns.',
    tags: ['Python', 'NLP', 'Product Management', 'Research', 'Data Pipelines'],
    image: '/images/project-language-lab.jpg',
    year: '2023',
  },
]
