import React, { useEffect, useState } from 'react';
import { api } from '../config';

const RealTimeView = () => {
    const [newData, setNewData] = useState(null);
    const [isUpdated, setIsUpdated] = useState(false); 

    const getRitoText = (ritoValue) => {
        switch (ritoValue) {
            case "0":
            case 0:
                return 'Convencional';
            case "1":
            case 1:
                return 'Kosher';
            case "3":
            case 3:
                return 'Rechazo Kosher';
            default:
                return 'Desconocido';
        }
    };

    useEffect(() => {
        const eventSource = new EventSource(`${api}/realtime/insert`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            const formattedData = {
                correlativo: data.rocorr,
                codigoPalco: data.rocpal,
                lado: data.rolado === 'I' ? 'Izquierdo' : 'Derecho',
                destinoComercial: data.rodest,
                hora: data.rohpro,
                rito: getRitoText(data.rorito),
            };

            setNewData(formattedData);

            setIsUpdated(true);
            setTimeout(() => setIsUpdated(false), 1000);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const styles = {
        card: {
            position: 'relative',
            margin: '20px auto',
            padding: '20px',
            maxWidth: '500px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'background-color 0.3s, transform 0.3s',
        },
        cardUpdated: {
            backgroundColor: '#91db79',
            transform: 'scale(1.05)',
        },
        topRight: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            textAlign: 'right',
        },
        date: {
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
        },
        time: {
            display: 'block',
            fontSize: '12px',
            color: '#555',
        },
        center: {
            fontSize: '36px',
            fontWeight: 'bold',
            margin: '20px 0',
        },
        right: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
        },
        bottom: {
            marginTop: '10px',
        },
        codigoPalco: {
            display: 'block',
            fontSize: '14px',
            margin: '5px 0',
        },
        destino: {
            display: 'block',
            fontSize: '14px',
            margin: '5px 0',
        },
        rito: {
            display: 'block',
            fontSize: '14px',
            margin: '5px 0',
        },
    };

    return (
        
            <div style={{ ...styles.card, ...(isUpdated ? styles.cardUpdated : {}) }}>
                <div style={styles.topRight}>
                    <span style={styles.date}>Hora: {newData ? newData.hora : 'Hora'}</span>
                </div>
                <div style={styles.center}>
                    <span>{newData ? newData.correlativo : 'Correlativo'}</span>
                </div>
                <div style={styles.right}>
                    <span>{newData ? newData.lado : 'Lado'}</span>
                </div>
                <div style={styles.bottom}>
                    <span style={styles.codigoPalco}>Código de Palco: {newData ? newData.codigoPalco : 'N/A'}</span>
                    <span style={styles.destino}>Destino: {newData ? newData.destinoComercial : 'N/A'}</span>
                    <span style={styles.rito}>Rito: {newData ? newData.rito : 'N/A'}</span>
                </div>
            </div>
        
    );
};

export default RealTimeView;
