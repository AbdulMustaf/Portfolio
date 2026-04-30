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
    skills: ['NLP', 'PyTorch', 'Scikit-learn', 'LLMs', 'Prompt Engineering', 'Azure AI'],
  },
  {
    category: 'DevOps & Tools',
    icon: '🛠️',
    skills: ['GitHub', 'Azure DevOps', 'CI/CD', 'Docker', 'Jira', 'Postman'],
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
