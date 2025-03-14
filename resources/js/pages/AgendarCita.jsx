import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { es } from "date-fns/locale";
import Navbar from '../components/navbar.jsx';
import 'react-datepicker/dist/react-datepicker.css'; // Estilos del calendario
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importa Axios
import styles from '../../css/agendarcita.module.css'; // Importa el archivo CSS
import Select from 'react-select'; // Para autocompletado de nombres

function AgendarCita() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [nombre, setNombre] = useState('');
    // const [celular, setCelular] = useState('');
    const [idUsuario, setIdUsuario] = useState('');
    const [miembros, setMiembros] = useState([]);
    const [nombreTutor, setNombreTutor] = useState('');
    const [idTutor, setIdTutor] = useState('');
    const [ministros, setMinistros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [mensajeExito, setMensajeExito] = useState("");
    const [error, setError] = useState('');
    const [errorCelular, setErrorCelular] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/user', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Error al obtener el usuario', error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchUser();

        const obtenerUsuarios = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/miembros', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setMiembros(response.data);
            } catch (error) {
                setError("Error al obtener miembros.");
                console.error("Error:", error);
            }
        };
        obtenerUsuarios();

        const obtenerMinistros = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/ministros', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setMinistros(response.data);
            } catch (error) {
                setError("Error al obtener usuarios.");
                console.error("Error:", error);
            }
        };
        obtenerMinistros();

        const fechaFormateada = selectedDate.toISOString().split('T')[0];
        obtenerHorariosDisponibles(fechaFormateada);
    }, [navigate,selectedDate]);

    const convertirHora24a12 = (hora24) => {
        const [hora, minutos] = hora24.split(':');
        let hora12 = parseInt(hora, 10);
        const periodo = hora12 >= 12 ? 'PM' : 'AM';
        if (hora12 > 12) {
            hora12 -= 12;
        }
        if (hora12 === 0) {
            hora12 = 12;
        }
        return `${String(hora12).padStart(2, '0')}:${minutos} ${periodo}`;
    };

    const convertirHora12a24 = (hora12) => {
        const [hora, minutos, periodo] = hora12.match(/(\d+):(\d+) (\w+)/).slice(1);
        let hora24 = parseInt(hora, 10);
        if (periodo === 'PM' && hora24 !== 12) {
            hora24 += 12;
        }
        if (periodo === 'AM' && hora24 === 12) {
            hora24 = 0;
        }
        return `${String(hora24).padStart(2, '0')}:${minutos}`;
    };

    const obtenerHorariosDisponibles = async (fecha) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/horariosDisponibles/${fecha}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (Array.isArray(response.data)) {
                if (response.data.length > 0) {
                    const horarios12h = response.data.map(convertirHora24a12);
                    setHorariosDisponibles(horarios12h);
                } else {
                    setHorariosDisponibles([]);
                }
            } else {
                console.error('La respuesta del backend no es un array:', response.data);
            }
        } catch (error) {
            console.error('Error al obtener horarios disponibles:', error);
            setHorariosDisponibles([]);
        }
    };

    const handleSeleccionUsuario = (selectedOption) => {
        setNombre(selectedOption.label);
        // setCelular(selectedOption.value);
        setIdUsuario(selectedOption.idUsuario);
    };

    const handleSeleccionTutor = (selectedOption) => {
        setNombreTutor(selectedOption.label);
        setIdTutor(selectedOption.idTutor);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // setErrorCelular('');

        if (!nombre || !selectedTime) {
            setError('Por favor, completa todos los campos.');
            return;
        }


        setEnviando(true);

        const cita = {
            usuario_id: idUsuario,
            tutor_id: idTutor,
            fecha: selectedDate.toISOString().split('T')[0],
            hora: convertirHora12a24(selectedTime),
        };

        try {
            const response = await axios.post('http://localhost:8000/api/agendarcitas', cita, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            const codigoCita = response.data.codigo;
            // setMensajeExito(`✅ Cita creada con éxito. Tu código es: ${codigoCita}. Guardalo para consultar tu cita si quieres cancelarla o modificarla después.`);
            setMensajeExito(`✅ Cita creada con éxito.`);
            const fechaFormateada = selectedDate.toISOString().split('T')[0];
            await obtenerHorariosDisponibles(fechaFormateada);
        } catch (error) {
            console.error('Error al agendar la cita:', error);
            setError('Hubo un error al agendar la cita. Por favor, intenta nuevamente.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div>
            <Navbar user={user} />
            <div className={styles.agendarContainer}>
                <div className={styles.agendarCard}>
                    {/* <img src="/logo3.png" alt="Logo Ministerio Altar Del Santisimo" className={styles.homeLogo} /> */}
                    <h1 className={styles.agendarTitulo}>Agendar Cita</h1>
                    {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    {errorCelular && <p className={styles.errorMessage}>{errorCelular}</p>}
                    <form onSubmit={handleSubmit} className="agendar-form">
                        <div className={styles.formGroup}>
                            <label>Selecciona una fecha:</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                locale={es}
                                className={`${styles.inputField}`} // Combina tus estilos con los del DatePicker
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Selecciona un horario:</label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                required
                            >
                                <option value="">Selecciona un horario</option>
                                {horariosDisponibles.map((horario, index) => (
                                    <option key={index} value={horario}>
                                        {horario}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <input value={idUsuario} disabled type='hidden' />
                        <div className={styles.formGroup}>
                            <label>Miembro:</label>
                            <Select
                                // options={usuarios.map(user => ({ label: user.nombre, value: user.celular, idUsuario: user.id }))}
                                options={miembros.map(miembro => ({ label: miembro.nombre, idUsuario: miembro.id }))}
                                onChange={handleSeleccionUsuario}
                                placeholder="Ingresa o selecciona un nombre"
                                className="input-field"
                            />
                        </div>

                        {/* <div className={styles.formGroup}>
                            <label>Número de celular:</label>
                            <input
                                type="tel"
                                value={celular}
                                onChange={(e) => {
                                    const input = e.target.value;
                                    if (/^\d{0,10}$/.test(input)) {
                                        setCelular(input);
                                        setErrorCelular('');
                                    } else {
                                        setErrorCelular('Solo se permiten números y un máximo de 10 dígitos.');
                                    }
                                }}
                                placeholder="Ingresa tu número de celular"
                                maxLength={10}
                                required
                                className="input-field"
                            />
                            {errorCelular && <p className={styles.errorMessage}>{errorCelular}</p>}
                        </div> */}

                        <input value={idTutor} disabled type='hidden' />
                        <div className={styles.formGroup}>
                            <label>Ministro:</label>
                            <Select
                                options={ministros.map(ministro => ({ label: ministro.nombre, idTutor: ministro.id }))}
                                onChange={handleSeleccionTutor}
                                placeholder="Ingresa o selecciona un nombre"
                                className="input-field"
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" className={`${styles.agendarButtons} ${styles.confirm}`} disabled={enviando}>
                                {enviando ? "Agendando..." : "Confirmar Cita"}
                            </button>
                            <Link to="/dashboard">
                                <button className={`${styles.agendarButtons} ${styles.back}`}>Volver al Inicio</button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AgendarCita;
