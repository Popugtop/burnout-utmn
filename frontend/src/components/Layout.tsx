import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface Props {
  children: ReactNode;
  hideNav?: boolean;
}

export default function Layout({ children, hideNav }: Props) {
  return (
    <div className="min-h-screen bg-base-900 grid-bg font-body text-text-primary flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1 pt-16">{children}</main>
      {!hideNav && <Footer />}
    </div>
  );
}
