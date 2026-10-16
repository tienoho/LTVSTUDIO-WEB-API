'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
            {/* Top Navbar */}
            <Navbar
              onOpenMobileNav={() => setIsMobileDrawerOpen(true)}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            />

            {/* Mobile Drawer */}
            <MobileDrawer
              isOpen={isMobileDrawerOpen}
              onClose={() => setIsMobileDrawerOpen(false)}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            />

            {/* Main Page Body */}
            <main className="flex-1">
              {children}
            </main>

            {/* Bottom Footer */}
            <Footer />

            {/* Global Change Password Modal */}
            <ChangePasswordModal
              isOpen={isChangePasswordOpen}
              onClose={() => setIsChangePasswordOpen(false)}
            />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppShell;
