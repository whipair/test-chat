// app/layout.tsx (or layout.js)
import { Inter } from 'next/font/google';
import { FloatingChatClientWrapper } from './components/FloatingChatClientWrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chat App',
  description: 'Chat App',
};

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <FloatingChatClientWrapper />
      </body>
    </html>
  );
}