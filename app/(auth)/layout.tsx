interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Auth Content - No header for cleaner auth experience */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          {/* Clerk Component */}
          {children}
        </div>
      </div>
    </div>
  );
}
