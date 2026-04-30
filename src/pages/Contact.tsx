import { FaEnvelope, FaCoffee, FaLinkedin, FaGithub } from 'react-icons/fa'
import { profileData } from '../data/profileData'
import Footer from '../components/Footer'

export default function Contact() {
  return (
    <main className="bg-netflix-dark min-h-screen">
      <div className="contact-container">

        {/* LinkedIn-style profile badge */}
        <div className="linkedin-badge-custom">
          <img
            src="/images/hero.jpg"
            alt={profileData.name}
            className="badge-avatar"
          />
          <div className="badge-content">
            <h3 className="badge-name">{profileData.name}</h3>
            <p className="badge-title">{profileData.headline}</p>
            <p className="badge-description whitespace-pre-line">{profileData.bio}</p>
            <p className="badge-company">{profileData.tagline}</p>
            <a
              href={profileData.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="badge-link"
            >
              <FaLinkedin className="linkedin-icon" /> View Profile
            </a>
          </div>
        </div>

        <div className="contact-header">
          <p>I'm always up for a chat or a coffee! Feel free to reach out.</p>
        </div>

        <div className="contact-details">
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <a href={`mailto:${profileData.email}`} className="contact-link">
              {profileData.email}
            </a>
          </div>
          <div className="contact-item">
            <FaGithub className="contact-icon" />
            <a
              href={profileData.github}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              github.com/AbdulMustaf
            </a>
          </div>
          <div className="contact-fun">
            <p>Or catch up over a coffee ☕</p>
            <FaCoffee className="coffee-icon" />
          </div>
        </div>

      </div>
      <Footer />
    </main>
  )
}
