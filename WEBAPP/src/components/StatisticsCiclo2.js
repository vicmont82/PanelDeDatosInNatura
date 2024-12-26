import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    BarElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    BarElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const StatisticsCiclo2 = ({ data }) => {
    const mediasPorHora = data.reduce((acc, item) => {
        const hour = item["Hora de Ingreso"] ? item["Hora de Ingreso"].slice(0, 2) : '00';
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

    const datosPorCamara = data.reduce((acc, item) => {
        const camara = item["Cámara"] || 'Desconocida';
        if (!acc[camara]) {
            acc[camara] = [];
        }
        acc[camara].push(item);
        return acc;
    }, {});

    const mermaPorCamara = Object.keys(datosPorCamara).map((camara) => {
        const totalMermaOreo = datosPorCamara[camara].reduce((acc, item) => {
            const mermaOreo = parseFloat(item["Merma de oreo"]) || 0;
            return acc + mermaOreo;
        }, 0);
        const totalEntradas = datosPorCamara[camara].length;
        const mermaDeOreoPromedio = totalEntradas > 0 ? totalMermaOreo / totalEntradas : 0;
        return {
            camara,
            mermaPromedio: mermaDeOreoPromedio
        };
    });


    const lineData = {
        labels: mediasPorHoraData.map(item => item.hour),
        datasets: [
            {
                label: 'Cantidad Acumulada',
                data: mediasPorHoraData.map(item => item.count),
                borderColor: '#8884d8',
                backgroundColor: '#8884d8',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const recuentoOreoNegativoPorCamara = Object.keys(datosPorCamara).map((camara) => {
        const recuentoNegativo = datosPorCamara[camara].reduce((acc, item) => {
            const pesoPalco = parseFloat(item["Peso de palco"]) || 0;
            const pesoOreo = parseFloat(item["Peso de oreo"]) || 0;
            if (pesoOreo - pesoPalco > 0) {
                acc++;
            }
            return acc;
        }, 0);
        return {
            camara,
            recuentoNegativo
        };
    });

    const mermaPorCamaraSprayChilling = Object.keys(datosPorCamara)
        .filter(camara => ['07', '08', '09', '10', '11', '12'].includes(camara))
        .map((camara) => {
            const totalMermaOreo = datosPorCamara[camara].reduce((acc, item) => {
                const mermaOreo = parseFloat(item["Merma de oreo"]) || 0;
                return acc + mermaOreo;
            }, 0);
            const totalEntradas = datosPorCamara[camara].length;
            const mermaDeOreoPromedio = totalEntradas > 0 ? totalMermaOreo / totalEntradas : 0;
            return {
                camara,
                mermaPromedio: mermaDeOreoPromedio
            };
        });

    const mermaPrimeras30PorCamara = Object.keys(datosPorCamara).map((camara) => {
        const entries = datosPorCamara[camara];
        const sortedEntries = entries.slice().sort((a, b) => {
            const timeA = a["Hora de Ingreso"] || '00:00:00';
            const timeB = b["Hora de Ingreso"] || '00:00:00';
            return timeA.localeCompare(timeB);
        });
        const first30Entries = sortedEntries.slice(0, 30);
        const mermaValues = first30Entries.map(item => parseFloat(item["Merma de oreo"]) || 0);
        const n = mermaValues.length;
        const sum = mermaValues.reduce((acc, val) => acc + val, 0);
        const average = n > 0 ? sum / n : 0;
        const variance = n > 1 ? mermaValues.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (n - 1) : 0;
        const stdDev = Math.sqrt(variance);
        return {
            camara,
            averageMerma: average,
            stdDevMerma: stdDev
        };
    });

    return (
        <Box p={1}>
            <Typography variant="h5">Ingreso a Cuarteo</Typography>
            <Grid container spacing={1} alignItems="stretch">
                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold">Merma por Cámara</Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader aria-label="merma por camara table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Camara</TableCell>
                                            <TableCell align="right">Merma (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mermaPorCamara.map((cam) => (
                                            <TableRow key={cam.camara}>
                                                <TableCell component="th" scope="row">
                                                    Cam {cam.camara}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {cam.mermaPromedio.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold">Merma cámaras Spray Chilling</Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader aria-label="merma camaras spray chilling table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Camara</TableCell>
                                            <TableCell align="right">Merma (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mermaPorCamaraSprayChilling.map((cam) => (
                                            <TableRow key={cam.camara}>
                                                <TableCell component="th" scope="row">
                                                    Cam {cam.camara}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {cam.mermaPromedio.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold">Merma Negativa</Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader aria-label="medias con oreo negativo table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Camara</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recuentoOreoNegativoPorCamara.map((cam) => (
                                            <TableRow key={cam.camara}>
                                                <TableCell component="th" scope="row">
                                                    Cam {cam.camara}
                                                </TableCell>
                                                <TableCell align="right">{cam.recuentoNegativo}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Merma Primeras 30 Medias</Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader aria-label="merma table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Camara</TableCell>
                                            <TableCell align="right">Merma (%)</TableCell>
                                            <TableCell align="right">Desv. Std. (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mermaPrimeras30PorCamara.map((cam) => (
                                            <TableRow key={cam.camara}>
                                                <TableCell component="th" scope="row">
                                                    Cam {cam.camara}
                                                </TableCell>
                                                <TableCell align="right">{cam.averageMerma.toFixed(2)}</TableCell>
                                                <TableCell align="right">{cam.stdDevMerma.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold">Medias por Hora</Typography>
                            <Box sx={{ height: '300px' }}>
                                <Line
                                    data={lineData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                ticks: { font: { size: 10 } },
                                            },
                                            y: {
                                                ticks: { font: { size: 10 } },
                                            },
                                        },
                                        plugins: {
                                            legend: { display: false },
                                        },
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

};

export default StatisticsCiclo2;
