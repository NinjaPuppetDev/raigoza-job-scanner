'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ExternalLink,
  Bell, FileText, ChevronDown,
} from 'lucide-react';

const navItems = [
  { icon: <LayoutDashboard size={16} />, label: 'Dashboard', href: '/' },
  { icon: <Users size={16} />, label: 'Candidates', href: '/candidates' },
  { icon: <ExternalLink size={16} />, label: 'Apply', href: '/apply/rec6naM7TOO0txTv3' },
];

const bottomItems = [
  { icon: <Bell size={16} />, label: 'Reminders', badge: '3' },
  { icon: <FileText size={16} />, label: 'Templates' },
  { icon: <FileText size={16} />, label: 'Notes' },
];

// Nav items shown in the mobile bottom bar (first 3 + reminders)
const mobileNavItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/' },
  { icon: <Users size={20} />, label: 'Candidates', href: '/candidates' },
  { icon: <ExternalLink size={20} />, label: 'Apply', href: '/apply/rec6naM7TOO0txTv3' },
  { icon: <Bell size={20} />, label: 'Reminders', href: '#', badge: '3' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div className="sidebar-logo-text">
            <strong>RAIGOZA</strong>
            <span>Job Scanner</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <div className="sidebar-section">Workspace</div>
          {bottomItems.map((item) => (
            <a key={item.label} className="nav-item">
              {item.icon} {item.label}
              {item.badge && <span className="badge">{item.badge}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-row">
            <div className="user-avatar">R</div>
            <div className="user-info">
              <strong>Raigoza</strong>
              <span>Product Designer</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {mobileNavItems.map((item) => {
          const isActive = item.href !== '#' && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`mobile-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="mobile-nav-icon">
                {item.icon}
                {item.badge && <span className="mobile-nav-badge">{item.badge}</span>}
              </span>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}