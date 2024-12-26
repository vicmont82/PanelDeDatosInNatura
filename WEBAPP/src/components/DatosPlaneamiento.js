import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Paper, Box, Button, Grid, Typography } from '@mui/material';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import GetAppIcon from '@mui/icons-material/GetApp';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { api } from '../config';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

const AgregadoPorCamara = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const formattedDate = selectedDate instanceof Date && !isNaN(selectedDate)
        ? format(selectedDate, 'yyyyMMdd')
        : null;

    useEffect(() => {
        const fetchData = async () => {
            if (!formattedDate) return;

            setLoading(true);
            try {
                const response = await axios.get(`${api}/camarasRito?fecha=${formattedDate}`);

                const flattenedData = [];
                response.data.forEach(camaraObj => {
                    const { Camara, Tropas } = camaraObj;
                    Tropas.forEach(tropaObj => {
                        const { Tropa, Ritos } = tropaObj;
                        Ritos.forEach(ritoObj => {
                            const {
                                Rito, Total, PorAmparoDos,
                                Peso_Promedio, Peso_Total
                            } = ritoObj;
                            PorAmparoDos.forEach(amparoObj => {
                                const { AmparoDos, Count } = amparoObj;
                                flattenedData.push({
                                    Camara,
                                    Tropa,
                                    Rito,
                                    AmparoDos,
                                    Count,
                                    TotalRito: Total,
                                    Peso_Promedio,
                                    Peso_Total
                                });
                            });
                        });
                    });
                });

                setData(flattenedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };

        fetchData();
    }, [formattedDate]);

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Agregado');
        XLSX.writeFile(wb, `agregado_${formattedDate}.xlsx`);
    };

    // Función para formatear el rito
    const ritoFormatter = (valor) => {
        switch (valor) {
            case '0':
                return 'Convencional';
            case '1':
                return 'Kosher';
            case '3':
                return 'Rechazo Kosher';
            default:
                return valor;
        }
    };

    const columnDefs = [
        { headerName: 'Tropa', field: 'Tropa', width: 120 },
        {
            headerName: 'Rito',
            field: 'Rito',
            width: 150,
            valueFormatter: params => ritoFormatter(params.value)
        },
        { headerName: 'Amparo', field: 'AmparoDos', width: 150 },
        { headerName: 'Cantidad', field: 'Count', width: 120 },
        { headerName: 'Total por Rito', field: 'TotalRito', width: 150 },
    ];

    const defaultColDef = {
        sortable: true,
        resizable: true,
        filter: true,
    };

    // Agrupamos los datos por Camara
    const groupedDataByCamara = {};
    data.forEach(item => {
        const { Camara } = item;
        const camaraKey = Camara === null ? '' : Camara;
        if (!groupedDataByCamara[camaraKey]) {
            groupedDataByCamara[camaraKey] = [];
        }
        groupedDataByCamara[camaraKey].push(item);
    });

    const camaras = Object.keys(groupedDataByCamara);

    return (
        <Paper style={{ height: '100%', width: '100%', padding: 16 }}>
            <Box display="flex" justifyContent="flex-start" mb={2}>
                <Button
                    variant="contained"
                    onClick={handleExport}
                    style={{
                        backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346',
                        color: data.length === 0 ? '#6b6e6b' : 'white',
                        marginBottom: 10
                    }}
                    disabled={data.length === 0}
                    startIcon={<GetAppIcon />}
                >
                    Exportar a Excel
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {camaras.map(camara => {
                        const rows = groupedDataByCamara[camara];

                        // Agregamos datos por Rito
                        const sumByRito = {};
                        rows.forEach(row => {
                            const ritoLabel = ritoFormatter(row.Rito);
                            sumByRito[ritoLabel] = (sumByRito[ritoLabel] || 0) + row.Count;
                        });
                        const ritoData = Object.keys(sumByRito).map(key => ({ name: key, value: sumByRito[key] }));

                        // Agregamos datos por AmparoDos dentro de cada Rito
                        const sumByAmparo = {};
                        rows.forEach(row => {
                            const key = `${ritoFormatter(row.Rito)} - ${row.AmparoDos}`;
                            sumByAmparo[key] = (sumByAmparo[key] || 0) + row.Count;
                        });
                        const amparoData = Object.keys(sumByAmparo).map(key => ({ name: key, value: sumByAmparo[key] }));

                        return (
                            <Grid item xs={12} sm={6} key={camara}>
                                {camara !== '' && (
                                    <Typography variant="h6" style={{ marginBottom: 10 }}>Cámara: {camara}</Typography>
                                )}

                                <Box display="flex" justifyContent="space-between" mb={2}>
                                    <Box width="48%">
                                        <Typography variant="subtitle1">Total por Rito</Typography>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={ritoData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip tick={{ fontSize: 12 }} />
                                                <Legend tick={{ fontSize: 12 }} />
                                                <Bar dataKey="value" fill="#005BB5" name="Cantidad">
                                                    <LabelList dataKey="value" position="top" fontSize={12} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    <Box width="48%">
                                        <Typography variant="subtitle1">Total por Amparo y Rito</Typography>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={amparoData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip tick={{ fontSize: 12 }} />
                                                <Legend tick={{ fontSize: 12 }} />
                                                <Bar dataKey="value" fill="#00796B" name="Cantidad">
                                                    <LabelList dataKey="value" position="top" fontSize={12} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
                                    <AgGridReact
                                        rowData={rows}
                                        columnDefs={columnDefs}
                                        defaultColDef={defaultColDef}
                                        pagination={true}
                                        paginationPageSize={20}
                                        rowHeight={30}
                                    />
                                </div>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Paper>
    );
};

export default AgregadoPorCamara;
