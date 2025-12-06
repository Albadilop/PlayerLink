import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { emailServices } from "../services/emailServices";
import type { User } from "../types";

export const Reset: React.FC = () => {
	const { store } = useGlobalReducer();
	//utilizamos useLocation para poder manejar valores grandes ya que useParams no permite este tipo de valores 
	const location = useLocation();
	//almacenamos en variable queryParams la busqueda realizada que se encuentra en el url
	const queryParams = new URLSearchParams(location.search);
	//extraemos el token del queryPArams
	const token = queryParams.get('token');
	const [password, setPassword] = useState<string>('');
	const [repeatPassword, setRepeatPassword] = useState<string>("");
	const [user, setUser] = useState<User | null>(null);
	const navigate = useNavigate();
	const [success, setSuccess] = useState<boolean | ''>('');
	const [showPassword, setShowPassword] = useState<boolean>(false); // estado pra enseñar/esconder contraseña
	const [errorPassword, setErrorPassword] = useState<string>(""); // estado para error si la contraseña no es la misma
	const [passwordErrors, setPasswordErrors] = useState<string[]>([]); //estado para condiciones de la contraseña

	useEffect(() => {
		if (token) {
			//creamos funcion async para que el correcto uso del useEffect 
			const fetchData = async () => {
				//verificamos que el token sea correcto y podemos saber que usuario es el que esta accediendo con la identidad del token
				const resp = await emailServices.checkAuth(token);
				if (resp && resp.user) {
					setUser(resp.user);
				}
			};
			fetchData();
		} else {
			alert('The reset link has expired. Please request a new password reset');
		}
	}, [token]);

	const validatePassword = (password: string): string[] => {
		const errors: string[] = [];
		if (password.length < 8) errors.push("at least 8 characters");
		if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
		if (!/[0-9]/.test(password)) errors.push("a number");
		if (!/[@$!%*?&.]/.test(password)) errors.push("a special character (@$!%*?&.)");
		return errors;
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPassword(value);

		const errors = validatePassword(value);
		setPasswordErrors(errors);

		if (repeatPassword && value !== repeatPassword) {
			setErrorPassword("Passwords do not match");
		} else {
			setErrorPassword("");
		}
	};

	const handleRepeatPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setRepeatPassword(value);

		if (password && value !== password) {
			setErrorPassword("Passwords do not match");
		} else {
			setErrorPassword("");
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// comprueba que la contraseña sea mas de 8 caracteres
		if (password.length < 8) {
			setErrorPassword("Password must have at least 8 characters");
			return;
		}

		//comprueba que las contraseñas coinciden
		if (password !== repeatPassword) {
			setErrorPassword("Passwords do not match");
			return;
		}
		setErrorPassword("");

		//pasamos a la actions.updatePassword el password y el token
		if (!token) {
			setErrorPassword("Invalid token");
			return;
		}

		const resp = await emailServices.updatePassword(password, token);
		if (resp && resp.success) {
			setSuccess(true);
			setTimeout(() => {
				navigate('/');
			}, 3000);
		} else {
			setSuccess(false);
		}
	};

	return (
		<>
			<div>
				<div className='d-flex justify-content-center'>
					<div className='card reset-card mt-5'>
						<div className="card-body">
							<h2 className="card-title text-center">Password Change Request</h2>
							<br />

							<form onSubmit={handleSubmit}>
								<div className="mx-4">

									<h5 htmlFor="basic-url" className="form-label mb-2 mt-2">
										Enter your new password {user && user?.email}
									</h5>
									<div>
										{/* New Password */}
										<label htmlFor="basic-url" className="form-label mb-0 mt-2">New password</label>
									</div>
									<div className="d-flex btn-reset-card-border rounded-2">

									<input
										type={showPassword ? "text" : "password"}
										onChange={handlePasswordChange}
										value={password}
										placeholder="Enter new password"
										className="w-100 border-0"
										autoComplete="new-password"
									/>
										<span
											className="input-group-text border-0 bg-white"
											onClick={() => setShowPassword(prev => !prev)}
											style={{ cursor: 'pointer' }}
										>
											<i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
										</span>
									</div>

									{/* Confirm Password */}
									<div>
										<label htmlFor="basic-url" className="form-label mt-3 mb-0">Confirm New Password</label>
									</div>
									<div className="d-flex btn-reset-card-border rounded-2">

									<input
										type="password"
										onChange={handleRepeatPasswordChange}
										value={repeatPassword}
										placeholder="Repeat new password"
										autoComplete="new-password"
											className="w-100 border-0"
										/>

									</div>

									{/* Mensaje con las condiciones contraseña que faltan */}
									{passwordErrors.length > 0 && (
										<h5 className="text-warning mt-2 register-message-errors">
											Password must contain {passwordErrors.join(", ")}.
										</h5>
									)}
									{/* Error contraseñas no coinciden */}
									{errorPassword && (
										<h6 className="text-danger mt-2 reset-message-errors">
											{errorPassword}
										</h6>
									)}

									{
										success !== '' ?
											success ?
												<h6 className="text-success mt-3 reset-message-errors">
													Success! Your password has been updated.
												</h6>
												:
												<h6 className="text-danger mt-3 reset-message-errors">
													There was an error. Try it again!
												</h6>
											:
											''
									}

									<input type="submit" value="Continue" className='w-100 rounded-2 mt-5 text-white bg-black btn-reset-card-border' />
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};


