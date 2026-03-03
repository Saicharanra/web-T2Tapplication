'use client';

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🗑️ Trash2Treasure
          </h1>
          <p className="text-gray-600">Create your account and start earning!</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
