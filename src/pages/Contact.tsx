import ContactButtons from '../components/ContactButtons'
import Footer from '../components/Footer'

export default function Contact() {
  return (
    <main className="bg-netflix-dark min-h-screen pt-[var(--nav-height)]">
      <div className="max-w-7xl mx-auto">
        <ContactButtons />
      </div>
      <Footer />
    </main>
  )
}
