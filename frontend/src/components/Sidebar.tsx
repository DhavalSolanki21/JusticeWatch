import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaGavel, 
  FaSearch, 
  FaChartBar, 
  FaUser, 
  FaSignOutAlt, 
  FaBriefcase 
} from 'react-icons/fa';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <aside className="jw-sidebar">
      <div className="sidebar-logo">
        <FaGavel className="logo-icon" />
        <h2>JusticeWatch</h2>
      </div>
      
      <div className="sidebar-user">
        <div className="user-avatar">{user.full_name[0]}</div>
        <div className="user-info">
          <span className="user-name">{user.full_name}</span>
          <span className="user-role">{user.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {user.role === 'judge' ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FaGavel className="nav-icon" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FaSearch className="nav-icon" />
              <span>Case Search</span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FaChartBar className="nav-icon" />
              <span>Analytics</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FaBriefcase className="nav-icon" />
              <span>My Dashboard</span>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FaSearch className="nav-icon" />
              <span>My Cases</span>
            </NavLink>
          </>
        )}
        
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FaUser className="nav-icon" />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt className="nav-icon" />
          <span>Log Out</span>
        </button>
      </div>

      <style>{`
        .jw-sidebar {
          width: 260px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-brass);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        
        .sidebar-logo {
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid var(--border-brass);
        }
        
        .logo-icon {
          color: var(--accent-brass);
          font-size: 1.5rem;
        }
        
        .sidebar-logo h2 {
          font-size: 1.25rem;
          font-family: var(--font-serif);
          color: var(--text-main);
          letter-spacing: 0.05em;
        }
        
        .sidebar-user {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid var(--border-muted);
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background-color: var(--accent-brass);
          color: var(--bg-main);
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
        }
        
        .user-role {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
        }
        
        .sidebar-nav {
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.5rem;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 0.95rem;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
          color: var(--accent-brass);
          background-color: rgba(176, 141, 87, 0.05);
        }
        
        .nav-item.active {
          color: var(--accent-brass);
          background-color: rgba(176, 141, 87, 0.08);
          border-left-color: var(--accent-brass);
        }
        
        .nav-icon {
          font-size: 1.1rem;
        }
        
        .sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-muted);
        }
        
        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 0.95rem;
          cursor: pointer;
          transition: color 0.2s ease;
          text-align: left;
        }
        
        .logout-btn:hover {
          color: var(--color-critical);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
