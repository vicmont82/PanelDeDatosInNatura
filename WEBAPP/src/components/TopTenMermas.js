import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { api } from '../config';
import { Box, Typography, IconButton, Paper, Collapse, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import * as XLSX from 'xlsx';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const groupByCamara = (data) => {
    const datosPorCamara = data.reduce((acc, item) => {
        const camara = item["Cámara"] || 'Desconocida';
        if (!acc[camara]) {
            acc[camara] = [];
        }
        acc[camara].push(item);
        return acc;
    }, {});

    return Object.keys(datosPorCamara).map((camara) => {
        const items = datosPorCamara[camara];
        const totalMerma = items.reduce((acc, val) => acc + (parseFloat(val["Merma de oreo"]) || 0), 0);
        const promedioMerma = items.length > 0 ? totalMerma / items.length : 0;
        return {
            camara,
            promedioMerma,
            detalles: items
        };
    });
};

const PanelMermaCamaras = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [agrupado, setAgrupado] = useState([]);
    const [expanded, setExpanded] = useState({});

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${api}/mermaTopTen?fecha=${formattedDate}`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [formattedDate]);

    useEffect(() => {
        const resultado = groupByCamara(data);
        setAgrupado(resultado);
    }, [data]);

    const toggleExpand = (camara) => {
        setExpanded((prev) => ({
            ...prev,
            [camara]: !prev[camara]
        }));
    };

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        agrupado.forEach((row) => {
            const detallesSinHoras = row.detalles.map(item => {
                const { "Hora de Ingreso": omit, ...rest } = item;
                return rest;
            });

            const ws = XLSX.utils.json_to_sheet(detallesSinHoras);
            XLSX.utils.book_append_sheet(wb, ws, `Cam_${row.camara}`);
        });
        XLSX.writeFile(wb, `merma_inicial_${formattedDate}.xlsx`);
    };

    const detailColumnDefs = [
        { headerName: 'Fecha faena', field: 'Fecha de faena', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Cod. Palco', field: 'Tipificación', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Tropa', field: 'Tropa', width: 90, filter: 'agNumberColumnFilter' },
        {
            headerName: 'Correlativo',
            field: 'Correlativo',
            width: 100,
            filter: 'agNumberColumnFilter',
            valueGetter: (params) => {
                const val = parseInt(params.data.Correlativo, 10);
                return isNaN(val) ? 0 : val;
            }
        },        
        { headerName: 'Lado', field: 'Lado', width: 90, filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Destino', field: 'Destino comercial', width: 100, filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Dientes', field: 'Dientes', width: 90, filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Palco (Kgs)', field: 'Peso de palco', width: 90, filter: 'agNumberColumnFilter', sortable: true },
        { headerName: 'Oreo (Kgs)', field: 'Peso de oreo', width: 90, filter: 'agNumberColumnFilter', sortable: true },
        {
            headerName: 'Merma (%)',
            field: 'Merma de oreo',
            width: 90,
            filter: 'agNumberColumnFilter',
            valueFormatter: (params) => {
                const val = parseFloat(params.value);
                return isNaN(val) ? '0.00' : val.toFixed(2);
            }
        },
        { headerName: 'Cabezas', field: 'Cabezas', width: 90, filter: 'agNumberColumnFilter' },
        {
            headerName: 'Horas Oreo',
            field: 'Horas de oreo',
            width: 70,
            filter: 'agNumberColumnFilter',
            valueFormatter: (params) => {
                const val = parseFloat(params.value);
                return isNaN(val) ? '0' : Math.round(val);
            }
        }
    ];

    const defaultColDef = {
        sortable: true,
        resizable: true,
        filter: true,
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                    Merma por Cámara (10% inicial)
                </Typography>
                {agrupado.length > 0 && (
                    <Button variant="contained" onClick={handleExport}>Exportar a Excel</Button>
                )}
            </Box>

            {agrupado.length === 0 ? (
                <Typography>No hay datos para la fecha seleccionada.</Typography>
            ) : (
                agrupado.map((row) => (
                    <Paper key={row.camara} sx={{ mb: 2, p: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1">Cam {row.camara}</Typography>
                            <Box display="flex" alignItems="center">
                                <Typography variant="body1" sx={{ mr: 2 }}>
                                    Merma Promedio: {row.promedioMerma.toFixed(2)}%
                                </Typography>
                                <IconButton onClick={() => toggleExpand(row.camara)}>
                                    {expanded[row.camara] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                            </Box>
                        </Box>
                        <Collapse in={expanded[row.camara]} timeout="auto" unmountOnExit>
                            <Box mt={2} className="ag-theme-alpine" style={{ height: '50vh', width: '100%' }}>
                                <AgGridReact
                                    rowData={row.detalles}
                                    columnDefs={detailColumnDefs}
                                    defaultColDef={defaultColDef}
                                    animateRows={true}
                                    getRowId={(params) => `${params.data["Fecha de faena"]}-${params.data["Correlativo"]}-${params.data["Lado"]}`}
                                />
                            </Box>
                        </Collapse>
                    </Paper>
                ))
            )}
        </Box>
    );
};

export default PanelMermaCamaras;
