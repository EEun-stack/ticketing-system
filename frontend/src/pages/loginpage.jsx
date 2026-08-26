import { useState } from 'react'
import useLoginAuth from '../hooks/useLoginAuth'
import '../styles/loginpage.css'

function LoginPage({ onLoginSuccess, onGoToForms }) {
	const [showPassword, setShowPassword] = useState(false)
		const { handleSubmit, isSubmitting, message } = useLoginAuth(onLoginSuccess)

	return (
		<main className="login-shell">
			<section className="login-card">

				<h1>Admin Login</h1>

				<form onSubmit={handleSubmit}>
					<label htmlFor="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
					/>

					<label htmlFor="password">Password</label>
					<div className="password-input">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autoComplete="current-password"
							required
						/>
						<button
							type="button"
							className="visibility-toggle"
							onClick={() => setShowPassword((visible) => !visible)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>

					<label className="remember-me">
						<input type="checkbox" name="remember" />
						<span>Remember me</span>
					</label>

					<button className="submit-button" type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Logging in...' : 'Login'}
					</button>
					{message && <p className="form-message" role="status">{message}</p>}
				</form>

				<button className="go-to-forms" type="button" onClick={onGoToForms}>
					Back to Request Form
				</button>
			</section>
		</main>
	)
}

export default LoginPage
