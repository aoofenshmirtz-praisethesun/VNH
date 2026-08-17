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
    <header className="glass-panel" style={{
      borderRadius: 0,
      borderTop: 0,
      borderLeft: 0,
      borderRight: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#0d1b2a', // Deep Navy Header
      borderColor: 'rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 20px rgba(13, 27, 42, 0.15)',
      color: '#ffffff'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #c9a15f 0%, #a68142 100%)',
            padding: '0.65rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(201, 161, 95, 0.3)'
          }}>
            <Droplet size={22} color="#0d1b2a" fill="#0d1b2a" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              NeerNetra <span style={{ fontSize: '0.7rem', color: '#c9a15f', border: '1px solid rgba(201, 161, 95, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.05em' }}>WATER ANALYTICS</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8', fontWeight: 500 }}>
              Nagpur Municipal Zone Monitoring Platform
            </div>
          </div>
        </Link>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
              <Home size={16} /> Overview
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255, 255, 255, 0.06)', padding: '0.4rem 0.95rem', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ background: 'linear-gradient(135deg, #c9a15f 0%, #a68142 100%)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={15} color="#0d1b2a" />
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#ffffff' }}>
                  {user?.username || 'nmcworker1'}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#c9a15f', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ShieldCheck size={10} /> Municipal Field Worker
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
