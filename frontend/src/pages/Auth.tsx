import { useState } from "react"
import { Navigate } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Login } from "@/components/auth/Login"
import { Register } from "@/components/auth/Register"
import { useAuth } from "@/contexts/AuthContext"

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login")
  const { isAuthenticated, loading } = useAuth()

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VibeBoost
          </h1>
          <p className="text-gray-600 mt-2">
            Transform your product photos with AI
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0">
            <Login onSwitchToRegister={() => setActiveTab("register")} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-0">
            <Register onSwitchToLogin={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <span>⚡</span>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🎨</span>
              <span>Professional Results</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Fast Generation</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>📱</span>
              <span>Easy Download</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}