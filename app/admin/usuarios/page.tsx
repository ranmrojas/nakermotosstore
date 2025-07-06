"use client";
import React from 'react';
import AdminProtected from '../../componentes/admin/AdminProtected';
import UserManager from '../../componentes/personas/UserManager';

export default function UsuariosPage() {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <UserManager />
        </div>
      </div>
    </AdminProtected>
  );
} 