import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WaterRippleCanvas } from '../components/WaterRippleCanvas';
import { VantaFogBackground } from '../components/VantaFogBackground';
import { FloatingDroplets } from '../components/FloatingDroplets';
import { Droplet, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('nmcworker1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '1.5rem 0'
    }}>
      {/* Layer 0: Vanta.js FOG Background in Navy & Gold */}
      <VantaFogBackground enableVantaFog={true} />

      {/* Layer 1: Interactive Canvas Water Ripple Layer */}
      <WaterRippleCanvas />

      {/* Layer 2: Floating Translucent Water Droplet Particles */}
      <FloatingDroplets />

      {/* Layer 10: Polished Login Card */}
      <div className="glass-panel login-card-animated animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 10,
        background: 'rgba(13, 27, 42, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201, 161, 95, 0.25)',
        borderRadius: '16px',
        color: '#ffffff'
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-droplet-float" style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #c9a15f 0%, #a68142 100%)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 6px 20px rgba(201, 161, 95, 0.35)'
          }}>
            <Droplet size={30} color="#0d1b2a" fill="#0d1b2a" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
            Worker Authentication
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Sign in to access Nagpur Municipal Zone Water Analytics Platform
          </p>
        </div>

        {error && (
          <div className="alert-warning-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
            <AlertCircle size={20} />
            <div style={{ fontSize: '0.875rem' }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }} htmlFor="username">Worker Username</label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  background: 'rgba(5, 7, 13, 0.65)',
                  border: '1px solid rgba(201, 161, 95, 0.25)',
                  color: '#ffffff'
                }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
              <User size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#c9a15f' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1' }} htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  background: 'rgba(5, 7, 13, 0.65)',
                  border: '1px solid rgba(201, 161, 95, 0.25)',
                  color: '#ffffff'
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#c9a15f' }} />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-gold btn-gold-shimmer"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.975rem' }}
          >
            {loading ? 'Authenticating...' : (
              <>Sign In to NeerNetra <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '1.75rem',
          padding: '1rem',
          background: 'rgba(201, 161, 95, 0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(201, 161, 95, 0.2)',
          fontSize: '0.825rem'
        }}>
          <div style={{ fontWeight: 700, color: '#c9a15f', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={15} /> Demo Worker Credentials:
          </div>
          <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <span>Username: <strong style={{ color: '#ffffff' }}>nmcworker1</strong></span>
            <span>Password: <strong style={{ color: '#ffffff' }}>password123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
