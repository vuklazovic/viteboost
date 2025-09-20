import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { AccountConflictAlert } from "./AccountConflictAlert"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSwitchToRegister: () => void
  onSuccess?: () => void
}

interface ConflictInfo {
  email: string
  suggestedAction: 'google_login' | 'email_login' | 'choose_method' | 'signup' | 'try_again'
}

export function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setConflictInfo(null)
    
    try {
      await login(data.email, data.password)
      toast.success("Welcome back!")
      onSuccess?.()
      navigate('/generate')
    } catch (error) {
      try {
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
          const detail = error.response.data.detail
          
          // Handle structured error responses
          if (typeof detail === 'object' && detail.suggested_action) {
            const validActions = ['google_login', 'email_login', 'choose_method', 'signup', 'try_again']
            
            if (validActions.includes(detail.suggested_action)) {
              if (detail.suggested_action === 'try_again') {
                toast.error(detail.message || "Invalid password. Please try again.")
              } else {
                setConflictInfo({
                  email: data.email,
                  suggestedAction: detail.suggested_action
                })
              }
            } else {
              toast.error("Invalid email or password")
            }
          } else if (typeof detail === 'string') {
            toast.error(detail)
          } else {
            toast.error("Invalid email or password")
          }
        } else {
          toast.error("Invalid email or password")
        }
      } catch (parseError) {
        // Error parsing login response
        toast.error("Login failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      // Note: This will redirect to Google, so we won't reach here
    } catch (error) {
      toast.error("Google login failed")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {conflictInfo && (
        <AccountConflictAlert
          email={conflictInfo.email}
          suggestedAction={conflictInfo.suggestedAction}
          onGoogleLogin={handleGoogleLogin}
          onSwitchToLogin={() => setConflictInfo(null)}
          onSwitchToRegister={onSwitchToRegister}
        />
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={onSwitchToRegister}
        >
          Sign up
        </button>
      </div>
    </div>
  )
}