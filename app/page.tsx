import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Pulse
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Democratic polling platform for participatory engagement
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/polls"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Polls
          </Link>
        </div>
      </div>
    </div>
  );
}
