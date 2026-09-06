export interface SkillCategory {
  category: string
  icon: string
  skills: string[]
}

export const skillsData: SkillCategory[] = [
  {
    category: 'Languages',
    icon: '💻',
    skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'Bash'],
  },
  {
    category: 'Frontend',
    icon: '🎨',
    skills: ['React', 'HTML5', 'CSS3', 'Tailwind CSS', 'Vite'],
  },
  {
    category: 'Backend & APIs',
    icon: '⚙️',
    skills: ['Flask', 'Node.js', 'REST APIs', 'GraphQL'],
  },
  {
    category: 'AI / ML',
    icon: '🤖',
    skills: [
      'Scikit-learn',
      'PyTorch',
      'Random Forest',
      'Gradient Boosting (XGBoost, LightGBM, CatBoost)',
      '1D-CNN / TCN / CNN-LSTM',
      'HMM-Viterbi Decoding',
      'SMOTE / Class Imbalance',
      'Feature Engineering',
      'NLP',
      'LLMs',
      'Prompt Engineering',
      'Azure AI',
    ],
  },
  {
    category: 'Time-Series & Signals',
    icon: '📈',
    skills: [
      'SciPy',
      'Savitzky-Golay Filtering',
      'Peak & Valley Detection',
      'Velocity / Jerk Derivation',
      'Windowed Segmentation',
      'Boundary-Tolerant Evaluation',
      'Temporal Smoothing',
      'IMU & Motion-Capture Data',
    ],
  },
  {
    category: 'Statistics & Research',
    icon: '🔬',
    skills: [
      'Participant-Grouped Cross-Validation',
      'Leakage & Circularity Auditing',
      'Prespecified Analysis Plans',
      'ICC / SEM / MDC',
      'BCa Bootstrap',
      'Permutation Testing',
      'Benjamini-Hochberg FDR',
      'ROC-AUC',
      'Reproducible Pipelines',
      'LaTeX',
    ],
  },
  {
    category: 'DevOps & Tools',
    icon: '🛠️',
    skills: ['GitHub', 'Azure DevOps', 'CI/CD', 'Docker', 'Jira', 'Postman', 'Pandas', 'NumPy', 'Matplotlib / Seaborn', 'YAML'],
  },
  {
    category: 'Testing & QA',
    icon: '🧪',
    skills: ['Automated Testing', 'Unit Testing', 'Integration Testing', 'Regression Testing', 'Test Plans'],
  },
  {
    category: 'Product & Design',
    icon: '📋',
    skills: ['Product Management', 'Agile / Scrum', 'Figma', 'User Stories', 'Roadmapping'],
  },
]
