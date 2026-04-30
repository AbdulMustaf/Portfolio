import { FaArrowLeft, FaExternalLinkAlt, FaDownload } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export default function Resume() {
  const resumeUrl = '/resume.pdf'
  const resumeViewerUrl = `${resumeUrl}#zoom=100`

  return (
    <div className="min-h-screen bg-netflix-dark flex flex-col">
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 bg-netflix-dark border-b border-white/5 px-4 sm:px-8 flex items-center justify-between"
        style={{ height: 'var(--nav-height)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm"
        >
          <FaArrowLeft size={12} />
          Back to Portfolio
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={resumeViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors text-sm"
            aria-label="Open resume in new tab"
          >
            <FaExternalLinkAlt size={11} />
            Open
          </a>
          <a
            href={resumeUrl}
            download="Abdullah_Mustafa_Resume.pdf"
            className="flex items-center gap-1.5 bg-netflix-red text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <FaDownload size={11} />
            Download
          </a>
        </div>
      </div>

      {/* PDF embed */}
      <div className="flex-1 flex flex-col" style={{ paddingTop: 0 }}>
        <iframe
          src={resumeViewerUrl}
          title="Abdullah Mustafa — Resume"
          className="w-full flex-1"
          style={{ minHeight: 'calc(100vh - var(--nav-height))', border: 'none' }}
        />

        {/* Mobile fallback — shown when iframe doesn't work */}
        <noscript>
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <p className="text-text-secondary">PDF preview is not available in this browser.</p>
            <a
              href={resumeViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-netflix-red text-white px-6 py-3 rounded font-semibold hover:bg-red-700 transition-colors"
            >
              <FaExternalLinkAlt size={14} />
              Open Resume PDF
            </a>
          </div>
        </noscript>
      </div>

      {/* Mobile fallback banner */}
      <div className="sm:hidden bg-netflix-dark-2 border-t border-white/5 px-4 py-4 flex justify-center gap-3">
        <a
          href={resumeViewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
        >
          <FaExternalLinkAlt size={12} />
          Open in browser
        </a>
        <span className="text-white/20">|</span>
        <a
          href={resumeUrl}
          download="Abdullah_Mustafa_Resume.pdf"
          className="flex items-center gap-2 text-sm text-netflix-red hover:text-red-400 transition-colors font-medium"
        >
          <FaDownload size={12} />
          Download PDF
        </a>
      </div>
    </div>
  )
}
