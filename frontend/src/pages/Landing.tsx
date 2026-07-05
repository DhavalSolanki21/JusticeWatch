import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGavel } from 'react-icons/fa';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  // Create a small decorative 5x5 color grid representing districts
  const decorativeColors = [
    '#4E9C54', '#D2963C', '#4E9C54', '#E67E22', '#4E9C54',
    '#D2963C', '#C0392B', '#D2963C', '#4E9C54', '#D2963C',
    '#4E9C54', '#4E9C54', '#E67E22', '#D2963C', '#4E9C54',
    '#E67E22', '#D2963C', '#4E9C54', '#C0392B', '#E67E22',
    '#4E9C54', '#4E9C54', '#D2963C', '#4E9C54', '#4E9C54'
  ];

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-box">
          <FaGavel className="logo-icon" />
          <span>JusticeWatch</span>
        </div>
      </header>

      <main className="landing-main">
        <div className="pitch-card">
          <h1>JusticeWatch</h1>
          <p className="subtitle">Predictive Legal Caseload Analytics & Complexity Mapping</p>
          <p className="description">
            An institutional case analytics portal designed for Judges and Lawyers of Gujarat District Courts. 
            Leveraging predictive modeling to assess case procedural complexity, aggregate court pendency, 
            and streamline district judicial load.
          </p>
          
          <button className="btn-brass-filled" onClick={() => navigate('/login')}>
            Sign In to Portal
          </button>
        </div>

        <div className="grid-decoration">
          <div className="deco-title">Gujarat Districts Severity Grid (Index mockup)</div>
          <div className="deco-squares">
            {decorativeColors.map((color, idx) => (
              <div key={idx} className="deco-square" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>PROTOTYPE NOTE: This is a predictive legal analytics system built for academic demonstration. Caseload numbers represent simulated administrative distributions across Gujarat State Court scopes.</p>
      </footer>

      <style>{`
        .landing-container {
          min-height: 100vh;
          background-color: var(--bg-main);
          display: flex;
          flex-direction: column;
          padding: 2rem;
          justify-content: space-between;
        }
        
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-brass);
          padding-bottom: 1rem;
        }
        
        .logo-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--text-main);
          letter-spacing: 0.05em;
        }
        
        .logo-icon {
          color: var(--accent-brass);
        }
        
        .landing-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4rem;
          max-width: 1200px;
          margin: 4rem auto;
          width: 100%;
        }
        
        .pitch-card {
          flex: 1.2;
          max-width: 600px;
        }
        
        .pitch-card h1 {
          font-size: 3.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-main);
          line-height: 1.1;
        }
        
        .pitch-card h1::after {
          content: '.';
          color: var(--accent-brass);
        }
        
        .pitch-card .subtitle {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }
        
        .pitch-card .description {
          color: var(--text-muted);
          font-size: 1.05rem;
          margin-bottom: 2.5rem;
          line-height: 1.7;
        }
        
        .grid-decoration {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid var(--border-brass);
          padding: 2.5rem;
          background-color: var(--bg-card);
          position: relative;
        }
        
        .grid-decoration::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: var(--accent-brass);
        }
        
        .deco-title {
          font-family: var(--font-serif);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-brass);
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .deco-squares {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
          width: 200px;
          height: 200px;
        }
        
        .deco-square {
          width: 100%;
          height: 100%;
          opacity: 0.75;
          transition: opacity 0.2s ease;
        }
        
        .deco-square:hover {
          opacity: 1;
          box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }
        
        .landing-footer {
          border-top: 1px solid var(--border-muted);
          padding-top: 1.5rem;
          text-align: center;
        }
        
        .landing-footer p {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.5;
        }
        
        @media (max-width: 868px) {
          .landing-main {
            flex-direction: column;
            gap: 3rem;
            margin: 2rem auto;
            text-align: center;
          }
          .pitch-card {
            max-width: 100%;
          }
          .grid-decoration {
            width: 100%;
            max-width: 320px;
          }
          .deco-squares {
            width: 180px;
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
