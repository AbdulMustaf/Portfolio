export interface SocialLink {
  platform: string
  label: string
  url: string
  icon: string
}

export const socialLinksData: SocialLink[] = [
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/abdullahmustafa',
    icon: 'FaLinkedin',
  },
  {
    platform: 'github',
    label: 'GitHub',
    url: 'https://github.com/abdullahmustafa',
    icon: 'FaGithub',
  },
  {
    platform: 'email',
    label: 'Email',
    url: 'mailto:abdullahmustafa300@gmail.com',
    icon: 'FaEnvelope',
  },
  {
    platform: 'resume',
    label: 'View Resume',
    url: '/resume',
    icon: 'FaFileAlt',
  },
]
