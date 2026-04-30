import type { ReactNode } from 'react'
import {
  SiPython, SiJavascript, SiTypescript, SiHtml5, SiCss,
  SiTailwindcss, SiVite, SiReact, SiFlask, SiNodedotjs,
  SiGraphql, SiPytorch, SiGithub,
  SiDocker, SiJira, SiPostman, SiFigma, SiMysql,
} from 'react-icons/si'
import {
  FaJava, FaBrain, FaRobot, FaCode,
  FaTerminal, FaExchangeAlt, FaMicrosoft,
} from 'react-icons/fa'
import { MdBugReport } from 'react-icons/md'
import { BsKanban, BsClipboard, BsBarChart } from 'react-icons/bs'
import { skillsData } from '../data/skillsData'

// Maps each skill name → icon component
const SKILL_ICONS: Record<string, ReactNode> = {
  // Languages
  Python:               <SiPython />,
  JavaScript:           <SiJavascript />,
  TypeScript:           <SiTypescript />,
  Java:                 <FaJava />,
  SQL:                  <SiMysql />,
  Bash:                 <FaTerminal />,
  // Frontend
  React:                <SiReact />,
  HTML5:                <SiHtml5 />,
  CSS3:                 <SiCss />,
  'Tailwind CSS':       <SiTailwindcss />,
  Vite:                 <SiVite />,
  // Backend & APIs
  Flask:                <SiFlask />,
  'Node.js':            <SiNodedotjs />,
  'REST APIs':          <FaExchangeAlt />,
  GraphQL:              <SiGraphql />,
  // AI / ML
  NLP:                  <FaBrain />,
  PyTorch:              <SiPytorch />,
  'Scikit-learn':       <FaBrain />,
  LLMs:                 <FaRobot />,
  'Prompt Engineering': <FaRobot />,
  'Azure AI':           <FaMicrosoft />,
  // DevOps & Tools
  GitHub:               <SiGithub />,
  'Azure DevOps':       <FaMicrosoft />,
  'CI/CD':              <SiGithub />,
  Docker:               <SiDocker />,
  Jira:                 <SiJira />,
  Postman:              <SiPostman />,
  // Testing & QA
  'Automated Testing':  <MdBugReport />,
  'Unit Testing':       <BsClipboard />,
  'Integration Testing':<FaCode />,
  'Regression Testing': <BsClipboard />,
  'Test Plans':         <BsClipboard />,
  // Product & Design
  'Product Management': <BsKanban />,
  'Agile / Scrum':      <SiJira />,
  Figma:                <SiFigma />,
  'User Stories':       <BsBarChart />,
  Roadmapping:          <BsBarChart />,
}

const fallback = <FaCode />

function animatedSkillName(skill: string) {
  let letterIndex = 0

  return skill.split(' ').map((word, wordIndex) => (
    <span key={`${word}-${wordIndex}`} className="skill-word">
      {word.split('').map((letter) => {
        const delay = letterIndex * 0.05
        letterIndex += 1

        return (
          <span
            key={`${word}-${letter}-${letterIndex}`}
            className="letter-drop"
            style={{ animationDelay: `${delay}s` }}
          >
            {letter}
          </span>
        )
      })}
    </span>
  ))
}

export default function SkillsGrid() {
  return (
    <div className="skills-container">
      {skillsData.map((cat, catIdx) => (
        <div key={cat.category} className="skill-category">
          <h3
            className="category-title"
            style={{ animationDelay: `${catIdx * 0.2}s` }}
          >
            {cat.category}
          </h3>

          <div className="skills-grid">
            {cat.skills.map((skill) => (
              <div key={skill} className="skill-card">
                <div className="skill-icon">
                  {SKILL_ICONS[skill] ?? fallback}
                </div>
                <h3 className="skill-name">
                  {animatedSkillName(skill)}
                </h3>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
