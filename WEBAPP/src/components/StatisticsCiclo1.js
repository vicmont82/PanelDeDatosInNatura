import React, { useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    BarElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importar el plugin de Data Labels
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ChartDataLabels // Registrar el plugin
);

// Colores más oscuros para las barras
const COLORS = ['#005BB5', '#00796B', '#C79100', '#E65100']; // Azul oscuro, Verde oscuro, Amarillo oscuro, Naranja oscuro

const StatisticsCiclo1 = ({ data }) => {
    const [showByTropa, setShowByTropa] = useState(false);

    const mediasPorHora = data.reduce((acc, item) => {
        const hour = item["Hora"] ? item["Hora"].slice(0, 2) : '00';
        if (!acc[hour]) {
            acc[hour] = 0;
        }
        acc[hour]++;
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

    const kosherCounts = data.reduce(
        (acc, item) => {
            if (item["Rito"] === "Kosher") acc.kosher++;
            if (item["Rito"] === "Rechazo Kosher") acc.rechazoKosher++;
            return acc;
        },
        { kosher: 0, rechazoKosher: 0 }
    );

    const totalKosherRechazo = kosherCounts.kosher + kosherCounts.rechazoKosher;

    const lineData = {
        labels: mediasPorHoraData.map(item => item.hour),
        datasets: [
            {
                label: 'Cantidad Acumulada',
                data: mediasPorHoraData.map(item => item.count),
                borderColor: '#444444', // Cambiar a un color más oscuro si lo prefieres
                backgroundColor: '#444444',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const kosherBarData = {
        labels: ["Kosher", "Rechazo Kosher"],
        datasets: [
            {
                label: 'Cantidad',
                data: [kosherCounts.kosher, kosherCounts.rechazoKosher],
                backgroundColor: [COLORS[0], COLORS[1]],
                datalabels: { // Configuración de etiquetas específicas para este dataset
                    color: '#FFFFFF', // Blanco para mejor contraste
                    font: {
                        weight: 'bold',
                        size: 12, // Opcional: Ajusta el tamaño de la fuente
                    }
                }
            }
        ]
    };

    const kosherBarOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const value = tooltipItem.raw;
                        const percent = ((value / totalKosherRechazo) * 100).toFixed(2);
                        return `${tooltipItem.label}: ${value} (${percent}%)`;
                    }
                }
            },
            datalabels: { // Configuración global de etiquetas
                anchor: 'end',
                align: 'start',
                color: '#FFFFFF', // Blanco para todas las etiquetas
                font: {
                    weight: 'bold',
                    size: 12, // Opcional
                }
            }
        }
    };

    // Procesamiento de datos para el gráfico dividido por Tropa
    const kosherByTropaData = () => {
        // Filtrar las tropas que tienen al menos un "Kosher" o "Rechazo Kosher"
        const tropasFiltradas = Array.from(new Set(
            data
                .filter(item => item['Rito'] === 'Kosher' || item['Rito'] === 'Rechazo Kosher')
                .map(item => item['Tropa'] || 'Desconocida')
        ));

        // Si no hay tropas filtradas, retornar datos vacíos
        if (tropasFiltradas.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }

        const datasetsKosher = {
            label: 'Kosher',
            data: tropasFiltradas.map(tropa => data.filter(item => item['Tropa'] === tropa && item['Rito'] === 'Kosher').length),
            backgroundColor: COLORS[0],
            datalabels: { // Configuración de etiquetas específicas para este dataset
                color: '#FFFFFF', // Blanco para mejor contraste
                font: {
                    weight: 'bold',
                    size: 12, // Opcional: Ajusta el tamaño de la fuente
                }
            }
        };
        const datasetsRechazoKosher = {
            label: 'Rechazo Kosher',
            data: tropasFiltradas.map(tropa => data.filter(item => item['Tropa'] === tropa && item['Rito'] === 'Rechazo Kosher').length),
            backgroundColor: COLORS[1],
            datalabels: { // Configuración de etiquetas específicas para este dataset
                color: '#FFFFFF', // Blanco para mejor contraste
                font: {
                    weight: 'bold',
                    size: 12, // Opcional: Ajusta el tamaño de la fuente
                }
            }
        };

        return {
            labels: tropasFiltradas,
            datasets: [datasetsKosher, datasetsRechazoKosher]
        };
    };

    const kosherByTropaOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const value = tooltipItem.raw;
                        // Calcula el total de Kosher y Rechazo Kosher para la tropa específica
                        const tropa = tooltipItem.label;
                        const totalTropa = data.filter(item => item['Tropa'] === tropa && (item['Rito'] === 'Kosher' || item['Rito'] === 'Rechazo Kosher')).length;
                        const percent = totalTropa > 0 ? ((value / totalTropa) * 100).toFixed(2) : 0;
                        return `${tooltipItem.dataset.label}: ${value} (${percent}%)`;
                    }
                }
            },
            datalabels: { // Configuración global de etiquetas
                anchor: 'end',
                align: 'start',
                color: '#FFFFFF', // Blanco para todas las etiquetas
                font: {
                    weight: 'bold',
                    size: 12, // Opcional
                }
            }
        }
    };

    const allTropas = Array.from(new Set(data.map(item => item['Tropa'] || 'Desconocida')));
    const allAmparos = Array.from(new Set(data.map(item => item['Amparo Dos'] || 'Desconocido')));

    const tropaData = data.reduce((acc, item) => {
        const tropa = item['Tropa'] || 'Desconocida';
        const amparoDos = item['Amparo Dos'] || 'Desconocido';

        if (!acc[tropa]) {
            acc[tropa] = { total: 0, amparoCounts: {} };
        }

        acc[tropa].total++;

        if (!acc[tropa].amparoCounts[amparoDos]) {
            acc[tropa].amparoCounts[amparoDos] = 0;
        }

        acc[tropa].amparoCounts[amparoDos]++;
        return acc;
    }, {});

    const columnDefs = [
        { headerName: 'Tropa', field: 'tropa', width: 80, pinned: 'left' },
        ...allAmparos.map(amparo => ({
            headerName: amparo,
            field: `amparo_${amparo}`,
            width: 100,
        })),
        { headerName: 'Total', field: 'total', width: 80 },
    ];

    const rowData = allTropas.map(tropa => {
        const row = {
            tropa: tropa,
            total: tropaData[tropa]?.total || 0,
        };

        allAmparos.forEach(amparo => {
            row[`amparo_${amparo}`] = tropaData[tropa]?.amparoCounts[amparo] || 0;
        });

        return row;
    });

    return (
        <Box>
            <Typography variant="h5">Ciclo 1</Typography>
            <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                    <Typography variant="h6">Medias por Hora</Typography>
                    <Box height={500}> {/* Aumentar altura de 300 a 400 */}
                        <Line
                            data={lineData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top',
                                    },
                                    datalabels: {
                                        display: false // No mostrar etiquetas en el gráfico de líneas
                                    }
                                }
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    {/* Contenedor Flex para el Título y el Botón con Iconos */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6">Producción Kosher (Medias)</Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setShowByTropa(!showByTropa)}
                            startIcon={showByTropa ? <ToggleOffIcon /> : <ToggleOnIcon />}
                        >
                            {showByTropa ? 'Mostrar Total' : 'Dividir por Tropa'}
                        </Button>
                    </Box>
                    <Box height={500}> 
                        {showByTropa ? (
                            <Bar
                                data={kosherByTropaData()}
                                options={kosherByTropaOptions}
                            />
                        ) : (
                            <Bar
                                data={kosherBarData}
                                options={kosherBarOptions}
                            />
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box className="ag-theme-alpine" sx={{ height: 500 }}>
                        <Typography variant="h6">Distribucion por tropa y amparo</Typography>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={{
                                sortable: true,
                                resizable: true,
                                cellStyle: { 'whiteSpace': 'nowrap' },
                            }}
                            rowHeight={25}
                            headerHeight={25}
                            pagination={true}
                            paginationPageSize={20}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StatisticsCiclo1;
