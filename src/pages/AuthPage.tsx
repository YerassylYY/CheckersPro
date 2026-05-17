import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { login, register, loginWithGoogle, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegister) await register(email, password, name)
    else await login(email, password)
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    await loginWithGoogle()
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold text-cyan-400">
        {isRegister ? 'Create Account' : 'Welcome Back'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <Field icon={<User size={18} />} value={name} onChange={setName} placeholder="Display name" />
        )}
        <Field icon={<Mail size={18} />} value={email} onChange={setEmail} placeholder="Email" type="email" />
        <Field icon={<Lock size={18} />} value={password} onChange={setPassword} placeholder="Password" type="password" />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
        </Button>
      </form>

      <Button variant="secondary" className="mt-3 w-full" onClick={handleGoogle} disabled={isLoading}>
        <LogIn size={18} />
        Continue with Google
      </Button>

      <button
        type="button"
        className="mt-4 text-center text-sm text-slate-400 hover:text-cyan-400"
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </div>
  )
}

function Field({
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
      <span className="text-slate-500">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
        required
      />
    </div>
  )
}
