import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, LogOut, UserCheck, ShieldCheck, Home } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, sticky: 'top', zIndex: 50 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
          }}>
            <Droplet size={24} color="#ffffff" fill="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NeerNetra <span style={{ fontSize: '0.7rem', verticalAlign: 'top', color: '#38bdf8', border: '1px solid #38bdf8', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px' }}>NMC</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Nagpur Municipal Corporation — Zone Water Monitor
            </div>
          </div>
        </Link>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
              <Home size={16} /> Overview
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem 0.85rem', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#0284c7', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.username || 'nmcworker1'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ShieldCheck size={10} /> NMC Field Worker
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', color: '#f87171' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
