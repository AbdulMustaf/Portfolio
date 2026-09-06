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
    id: 'sts-research',
    role: 'Machine Learning Researcher',
    org: 'Ontario Tech University',
    orgFull: 'Ontario Tech University (Supervised Research)',
    type: 'Research',
    dates: 'May 2026 – Present',
    location: 'Oshawa, ON',
    description:
      'Wearable-kinematics research on the five-repetition sit-to-stand test: a four-class phase detector, and a prespecified movement-control index built on top of it. Author of the paper "A phase detector is not a clock."',
    highlights: [
      'Built a subject-independent time-series pipeline segmenting the 5-repetition sit-to-stand test into four biomechanical phases from 100 Hz full-body kinematics (n = 32), reaching macro-F1 0.735 strict and 0.852 at ±100 ms boundary tolerance under 5-fold participant-grouped cross-validation',
      'Caught and rejected a leaky pipeline scoring 0.976, then hardened evaluation with fold-overlap checks, label-shuffle nulls and a standing leakage audit — random splits were shown to inflate results by ~0.05 macro-F1',
      'Showed a single pelvis IMU matches the full seven-sensor array to within Δ = 0.002 tolerant macro-F1, cutting the instrumentation needed for deployment sevenfold',
      'Proved the phase labels were a valid detector but not a clock: a ±175 ms convention froze every standing dwell at 0.370 s against a measured 0.030 s; re-segmenting on velocity gates recovered 320/320 repetitions and raised the same feature from ICC 0.334 to 0.726',
      'Developed the RisingControlIndex — a prespecified, unfitted movement-control score — separating age groups at AUC 0.771 with procedure-matched permutation p = 0.0033, and replicating 4/4 in an independent Parkinson\'s cohort',
      'Retracted my own headline result after proving it circular (macro-F1 0.867 → 0.100 once the edited features were removed) and published the ablation as part of the record',
      'Shipped the reproducibility layer: deterministic seeding, a YAML-driven experiment runner across 30+ pipeline variants, a provenance file tracing every figure to its source CSV, a 5-page paper and a 16-slide talk',
    ],
    tech: [
      'Python',
      'Scikit-learn',
      'PyTorch',
      'SciPy',
      'Pandas',
      'NumPy',
      'Random Forest',
      'Gradient Boosting (XGBoost, LightGBM, CatBoost)',
      '1D-CNN / TCN / CNN-LSTM',
      'HMM-Viterbi Decoding',
      'SMOTE / Class Imbalance',
      'Savitzky-Golay Filtering',
      'Participant-Grouped Cross-Validation',
      'ICC / SEM / MDC',
      'BCa Bootstrap',
      'Permutation Testing',
      'LaTeX',
      'YAML',
    ],
  },
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
