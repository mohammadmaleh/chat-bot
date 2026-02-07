import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">🤖 ChatBot</h1>
        <p className="text-xl text-gray-600">
          Modern AI Assistant - Built with Next.js 15
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            ✅ Next.js 15
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
            ✅ React Query
          </div>
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
            ✅ Tailwind CSS
          </div>

          <Button>Click me</Button>
        </div>
      </div>
    </div>
  );
}
