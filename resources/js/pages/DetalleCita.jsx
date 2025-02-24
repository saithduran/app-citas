import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { es } from "date-fns/locale";
import 'react-datepicker/dist/react-datepicker.css';
import '../../css/detallecita.css';
import axios from 'axios';

function DetalleCita() {
    const { codigo } = useParams();
    const navigate = useNavigate();
    const [cita, setCita] = useState(null);
    const [editando, setEditando] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [nombre, setNombre] = useState('');
    const [celular, setCelular] = useState('');
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [mensajeExito, setMensajeExito] = useState("");
    const [error, setError] = useState('');
    const [errorCelular, setErrorCelular] = useState('');
    
    const convertirHora24a12 = (hora24) => {
        if (!hora24) return "";
        const [hora, minutos] = hora24.split(':'); // Ignoramos segundos si existen
        let hora12 = parseInt(hora, 10);
        const periodo = hora12 >= 12 ? 'PM' : 'AM';
        if (hora12 > 12) hora12 -= 12;
        if (hora12 === 0) hora12 = 12;
        return `${String(hora12).padStart(2, '0')}:${minutos} ${periodo}`;
    };
    

    const convertirHora12a24 = (hora12) => {
        const [hora, minutos, periodo] = hora12.match(/(\d+):(\d+) (\w+)/).slice(1);
        let hora24 = parseInt(hora, 10);
        if (periodo === 'PM' && hora24 !== 12) hora24 += 12;
        if (periodo === 'AM' && hora24 === 12) hora24 = 0;
        return `${String(hora24).padStart(2, '0')}:${minutos}`;
    };

    useEffect(() => {
        const fetchCita = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/cita/${codigo}`);
                setCita(response.data);
                setNombre(response.data.nombre);
                setCelular(response.data.celular);
                setSelectedDate(response.data.fecha ? new Date(response.data.fecha + "T00:00:00") : new Date());
                setSelectedTime(convertirHora24a12(response.data.hora));
            } catch (error) {
                console.error('Error al obtener los detalles de la cita', error);
            }
        };
        fetchCita();
    }, [codigo]);

    useEffect(() => {
        if (!selectedDate) return;
        const fechaISO = selectedDate.toISOString().split('T')[0];
    
        const obtenerHorariosDisponibles = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/horarios-disponibles/${fechaISO}`);
                if (Array.isArray(response.data)) {
                    setHorariosDisponibles(response.data.map(convertirHora24a12));
                }
            } catch (error) {
                console.error('Error al obtener horarios disponibles', error);
            }
        };
    
        obtenerHorariosDisponibles();
    }, [selectedDate]);    

    const handleEdit = async () => {
        if (!nombre || !celular || !selectedTime) {
            setError('Por favor, completa todos los campos.');
            return;
        }
        if (!/^\d{10}$/.test(celular)) {
            setErrorCelular('Por favor, ingresa un número de celular válido (10 dígitos).');
            return;
        }
        try {
            await axios.put(`http://localhost:8000/api/cita/${codigo}`, {
                nombre,
                fecha: selectedDate.toISOString().split('T')[0],
                hora: convertirHora12a24(selectedTime),
                celular
            });
    
            setCita({
                ...cita,
                nombre,
                fecha: selectedDate.toISOString().split('T')[0],
                hora: convertirHora12a24(selectedTime),
                celular
            });
    
            setMensajeExito('✅ Cita actualizada con éxito.');
            setEditando(false);
        } catch (error) {
            console.error('Error al actualizar la cita', error);
        }
    };
    

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;

        try {
            await axios.delete(`http://localhost:8000/api/cita/${codigo}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            alert('Cita cancelada con éxito');
            navigate('/dashboard'); // Redirige al calendario después de cancelar
        } catch (error) {
            console.error('Error al cancelar la cita', error);
        }
    };

    return (
        <div className="detalle-container">
            <div className="detalle-card">
                <h2 className="detalle-title">Detalles de la Cita</h2>
                {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}
                {error && <p className="error-message">{error}</p>}
                {errorCelular && <p className="error-message">{errorCelular}</p>}
                {editando ? (
                    <div>
                        <label className='mt-3'>Nombre:</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                        <label className='mt-3'>Fecha:</label>
                        <DatePicker selected={selectedDate} onChange={setSelectedDate} dateFormat="dd/MM/yyyy" minDate={new Date()} locale={es} className="input-field"/>
                        <label className='mt-3'>Hora:</label>
                        <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                            <option value="">Selecciona un horario</option>
                            {horariosDisponibles.map((horario, index) => (
                                <option key={index} value={horario}>{horario}</option>
                            ))}
                        </select>
                        <label className='mt-3'>Celular:</label>
                        <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} className="input-field" maxLength={10}/>
                        <button onClick={handleEdit} className="detalle_buttons editar m-2">Guardar</button>
                        <button onClick={() => setEditando(false)} className="detalle_buttons cancelar mt-3">Volver</button>
                    </div>
                ) : (
                    <div>
                        <p><strong>Nombre:</strong> {cita?.nombre}</p>
                        <p><strong>Fecha:</strong> {cita?.fecha}</p>
                        <p><strong>Hora:</strong> {cita?.hora ? convertirHora24a12(cita.hora) : ''}</p>
                        <p><strong>Celular:</strong> {cita?.celular}</p>
                        <button onClick={() => setEditando(true)} className="detalle_buttons editar">Editar</button>
                        <button onClick={handleDelete} className="detalle_buttons cancelar">Cancelar Cita</button>
                        <Link to="/dashboard">
                            <button className="detalle_buttons back">Volver al Inicio</button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DetalleCita;
