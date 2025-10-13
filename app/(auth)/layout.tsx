interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">
      {/* Auth Content - Header is handled by AdaptiveHeader */}
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-8">
        <div className="w-full max-w-md">
          {/* Clerk Component */}
          {children}
        </div>
      </div>
    </div>
  );
}
