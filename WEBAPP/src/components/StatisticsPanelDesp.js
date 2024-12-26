import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement
} from 'chart.js';
import { format, parseISO, isValid } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement
);

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

const StatisticsPanelDesp = ({ data }) => {
    const [tropa, setTropa] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    const handleTropaChange = (event) => {
        setTropa(event.target.value);
    };

    const handleFilter = () => {
        const trimmedTropa = tropa.trim().toLowerCase();
        const filtered = data.filter(item => {
            const tropaArray = Array.isArray(item["Tropa"]) ? item["Tropa"] : [item["Tropa"]];
            const trimmedTropaArray = tropaArray.map(t => t.toString().trim().toLowerCase());
            return trimmedTropaArray.includes(trimmedTropa);
        });
        setFilteredData(filtered);
    };

    const formattedData = data.map(item => {
        const parsedDate = parseISO(item["Fecha de producción"]);
        const isValidDate = isValid(parsedDate);

        return {
            ...item,
            "Fecha de producción": isValidDate ? format(parsedDate, 'dd-MM-yyyy') : 'Invalid Date',
            "Hora de producción": item["Hora de producción"] || '00:00',
            "Peso Neto": parseFloat(item["Peso Neto"]) || 0
        };
    });

    const renderCajasPorHora = () => {
        const cajasPorHora = formattedData.reduce((acc, item) => {
            const hour = item["Hora de producción"] ? item["Hora de producción"].slice(0, 2) : '00'; // Extrae el HH
            if (!acc[hour]) {
                acc[hour] = 0;
            }
            acc[hour]++;
            return acc;
        }, {});

        const acumulativo = Object.keys(cajasPorHora).sort().reduce((acc, key, index, array) => {
            acc.push({
                hour: key,
                count: cajasPorHora[key] + (index > 0 ? acc[index - 1].count : 0)
            });
            return acc;
        }, []);

        const data = {
            labels: acumulativo.map(item => item.hour),
            datasets: [
                {
                    label: 'Cantidad Acumulada de Cajas por Hora',
                    data: acumulativo.map(item => item.count),
                    fill: false,
                    borderColor: '#8884d8',
                    tension: 0.1
                }
            ]
        };

        return (
            <Box>
                <Typography variant="h6">Cantidad Acumulada de Cajas por Hora</Typography>
                <Line data={data} options={{ responsive: true }} />
            </Box>
        );
    };

    const renderKilosPorProductoPaginado = () => {
        const kilosPorProducto = formattedData.reduce((acc, item) => {
            const producto = item['Producto'] || 'Desconocido';
            const pesoNeto = parseFloat(item["Peso Neto"]);
            if (!acc[producto]) {
                acc[producto] = 0;
            }
            acc[producto] += pesoNeto;
            return acc;
        }, {});

        const sortedProductos = Object.entries(kilosPorProducto)
            .sort((a, b) => b[1] - a[1])
            .map(([producto, kilos]) => ({ producto, kilos }));

        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = sortedProductos.slice(startIndex, endIndex);

        const data = {
            labels: pageData.map(item => item.producto),
            datasets: [
                {
                    label: 'Cantidad de Kilos por Producto',
                    data: pageData.map(item => item.kilos.toFixed(2)),
                    backgroundColor: pageData.map((_, index) => COLORS[index % COLORS.length])
                }
            ]
        };

        return (
            <Box>
                <Typography variant="h6">Cantidad de Kilos por Producto (Paginado)</Typography>
                <Bar data={data} options={{ responsive: true, indexAxis: 'y' }} />
                <Box mt={2} display="flex" justifyContent="center">
                    <IconButton
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                    >
                        <ArrowBackIos />
                    </IconButton>
                    <Typography variant="body1" mx={2}>
                        Página {currentPage + 1} de {Math.ceil(sortedProductos.length / itemsPerPage)}
                    </Typography>
                    <IconButton
                        onClick={() => setCurrentPage(prev => (prev + 1) < Math.ceil(sortedProductos.length / itemsPerPage) ? prev + 1 : prev)}
                        disabled={currentPage >= Math.ceil(sortedProductos.length / itemsPerPage) - 1}
                    >
                        <ArrowForwardIos />
                    </IconButton>
                </Box>
            </Box>
        );
    };

    const renderKilosPorProductoPorTropa = () => {
        const kilosPorProducto = filteredData.reduce((acc, item) => {
            const producto = item['Producto'] || 'Desconocido';
            const pesoNeto = parseFloat(item["Peso Neto"]);
            if (!acc[producto]) {
                acc[producto] = 0;
            }
            acc[producto] += pesoNeto;
            return acc;
        }, {});

        const data = {
            labels: Object.keys(kilosPorProducto),
            datasets: [
                {
                    label: `Cantidad de Kilos por Producto (Tropa: ${tropa})`,
                    data: Object.values(kilosPorProducto).map(kilos => kilos.toFixed(2)),
                    backgroundColor: Object.keys(kilosPorProducto).map((_, index) => COLORS[index % COLORS.length])
                }
            ]
        };

        return (
            <Box>
                <Typography variant="h6">Cantidad de Kilos por Producto (Tropa: {tropa})</Typography>
                <Bar data={data} options={{ responsive: true, indexAxis: 'y' }} />
            </Box>
        );
    };

    return (
        <Box>
            <Box mb={3}>
                <TextField
                    label="Ingrese Tropa"
                    value={tropa}
                    onChange={handleTropaChange}
                    variant="outlined"
                    size="small"
                    sx={{ marginBottom: 2, marginRight: 2 }}
                />
                <Button variant="contained" onClick={handleFilter}>Filtrar</Button>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    {renderCajasPorHora()}
                </Grid>
                <Grid item xs={12} md={4}>
                    {renderKilosPorProductoPaginado()}
                </Grid>
                <Grid item xs={12} md={4}>
                    {filteredData.length > 0 && renderKilosPorProductoPorTropa()}
                </Grid>
            </Grid>
        </Box>
    );
};

export default StatisticsPanelDesp;
