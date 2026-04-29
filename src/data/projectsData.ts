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
