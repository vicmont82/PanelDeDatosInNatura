import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { api } from '../config';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];

const StatisticsCard = ({ index }) => {
    const [data, setData] = useState(null);
    const [title, setTitle] = useState('');
    const [chartType, setChartType] = useState('bar');
    const [fetchedData, setFetchedData] = useState([]); // Nuevo estado para guardar los datos originales
    const [showByTropa, setShowByTropa] = useState(false); // Nuevo estado para alternar entre vista total y por tropa

    const fetchData = async () => {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const currentDate = Number(`${yyyy}${mm}${dd}`);

            const response = await fetch(`${api}/romaneos?fecha=${currentDate}`);
            const fetched = await response.json();

            setFetchedData(fetched);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Cada vez que cambie fetchedData o showByTropa, recalculamos la data del gráfico
        if (!fetchedData || fetchedData.length === 0) {
            setData(null);
            setTitle('Sin Datos');
            return;
        }

        let processedData;
        let newTitle = '';
        let newChartType = 'bar';

        switch (index) {
            case 0:
                newTitle = 'Medias por Hora (Acumulativo)';
                newChartType = 'line';

                const mediasPorHora = fetchedData.reduce((acc, item) => {
                    const hora = item["Hora"] ? item["Hora"].slice(0, 2) : '00';
                    if (!acc[hora]) {
                        acc[hora] = 0;
                    }
                    acc[hora]++;
                    return acc;
                }, {});

                let acumulado = 0;
                const mediasPorHoraData = Object.keys(mediasPorHora).sort().map((key) => {
                    acumulado += mediasPorHora[key];
                    return {
                        hour: key,
                        count: acumulado
                    };
                });

                processedData = {
                    labels: mediasPorHoraData.map(item => item.hour),
                    datasets: [
                        {
                            label: 'Cantidad Acumulada',
                            data: mediasPorHoraData.map(item => item.count),
                            borderColor: COLORS[0],
                            backgroundColor: COLORS[0],
                            fill: false,
                            tension: 0.1
                        },
                    ],
                };
                break;

            case 1:
                newTitle = 'Distribución por Destino Comercial';
                newChartType = 'pie';

                const distribucionPorDestino = fetchedData.reduce((acc, item) => {
                    const destino = item["Amparo Dos"] || 'Desconocido';
                    if (!acc[destino]) {
                        acc[destino] = 0;
                    }
                    acc[destino]++;
                    return acc;
                }, {});

                const distribucionPorDestinoData = Object.keys(distribucionPorDestino)
                    .map((key) => ({
                        name: key,
                        value: distribucionPorDestino[key]
                    }))
                    .sort((a, b) => b.value - a.value);

                processedData = {
                    labels: distribucionPorDestinoData.map(item => item.name),
                    datasets: [
                        {
                            data: distribucionPorDestinoData.map(item => item.value),
                            backgroundColor: COLORS,
                        },
                    ],
                };
                break;

            case 2:
                newTitle = 'Producción Kosher';
                newChartType = 'bar';

                // Datos totales de Kosher/Rechazo Kosher
                const kosherCounts = fetchedData.reduce(
                    (acc, item) => {
                        if (item["Rito"] === "1") acc.kosher++;
                        if (item["Rito"] === "4") acc.chalak++;
                        if (item["Rito"] === "5") acc.mujschard++;
                        if (item["Rito"] === "3") acc.rechazoKosher++;
                        return acc;
                    },
                    { kosher: 0, chalak: 0, mujschard: 0, rechazoKosher: 0 }
                );


                // Datos en general (sin tropa)
                const kosherBarData = {
                    labels: ['Kosher', 'Chalak', 'Mujschard', 'Rechazo Kosher'],
                    datasets: [
                        {
                            label: 'Cantidad',
                            data: [kosherCounts.kosher, kosherCounts.chalak, kosherCounts.mujschard, kosherCounts.rechazoKosher],
                            backgroundColor: [COLORS[0], COLORS[1]],
                        },
                    ],
                };

                // Datos por tropa
                const tropasFiltradas = Array.from(new Set(
                    fetchedData
                        .filter(item => item['Rito'] === '1' || item['Rito'] === '4' || item['Rito'] === '5' || item['Rito'] === '3')
                        .map(item => item['Tropa'] || 'Desconocida')
                ));

                const kosherByTropaData = () => {
                    if (tropasFiltradas.length === 0) {
                        return {
                            labels: [],
                            datasets: []
                        };
                    }

                    const datasetsKosher = {
                        label: 'Kosher',
                        data: tropasFiltradas.map(tropa => fetchedData.filter(item => item['Tropa'] === tropa && item['Rito'] === '1').length),
                        backgroundColor: COLORS[0],
                    };
                    const datasetsChalak = {
                        label: 'Chalak',
                        data: tropasFiltradas.map(tropa => fetchedData.filter(item => item['Tropa'] === tropa && item['Rito'] === '4').length),
                        backgroundColor: COLORS[0],
                    };
                    const datasetsMujschard = {
                        label: 'Mujschard',
                        data: tropasFiltradas.map(tropa => fetchedData.filter(item => item['Tropa'] === tropa && item['Rito'] === '5').length),
                        backgroundColor: COLORS[0],
                    };
                    const datasetsRechazoKosher = {
                        label: 'Rechazo Kosher',
                        data: tropasFiltradas.map(tropa => fetchedData.filter(item => item['Tropa'] === tropa && item['Rito'] === '3').length),
                        backgroundColor: COLORS[1],
                    };

                    return {
                        labels: tropasFiltradas,
                        datasets: [datasetsKosher, datasetsChalak, datasetsMujschard,datasetsRechazoKosher]
                    };
                };

                processedData = showByTropa ? kosherByTropaData() : kosherBarData;
                break;

            default:
                newTitle = 'Sin Datos';
                processedData = null;
                break;
        }

        setTitle(newTitle);
        setChartType(newChartType);
        setData(processedData);
    }, [fetchedData, index, showByTropa]);

    if (!data) {
        return null;
    }

    return (
        <Box
            sx={{
                backgroundColor: '#fff',
                padding: 2,
                borderRadius: 2,
                boxShadow: 1,
                height: '100%',
            }}
        >
            <Typography variant="h6" align="center" sx={{ marginBottom: 1 }}>
                {title}
            </Typography>

            {/* Solo mostrar el botón si es el chart Kosher (index 2) */}
            {index === 2 && (
                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setShowByTropa(!showByTropa)}
                        startIcon={showByTropa ? <ToggleOffIcon /> : <ToggleOnIcon />}
                    >
                        {showByTropa ? 'Mostrar Total' : 'Dividir por Tropa'}
                    </Button>
                </Box>
            )}

            <Box height={300}>
                {chartType === 'bar' && (
                    <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {chartType === 'line' && (
                    <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {chartType === 'pie' && (
                    <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
            </Box>
        </Box>
    );
};

export default StatisticsCard;
