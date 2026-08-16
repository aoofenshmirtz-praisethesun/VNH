import React from 'react';
import { Database, UserCheck } from 'lucide-react';

export const SyntheticBadge = ({ isSynthetic, size = 'normal' }) => {
  if (isSynthetic) {
    return (
      <span className="badge badge-synthetic" title="This record was generated from historical demo dataset">
        <Database size={size === 'small' ? 10 : 12} /> Demo data
      </span>
    );
  }

  return (
    <span className="badge badge-real" title="Verified NMC worker upload">
      <UserCheck size={size === 'small' ? 10 : 12} /> Worker upload
    </span>
  );
};
