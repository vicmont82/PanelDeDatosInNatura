import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CircularProgress, Paper, Box, Button } from '@mui/material';
import { format } from 'date-fns';
import GetAppIcon from '@mui/icons-material/GetApp';
import StatisticsCiclo2 from './StatisticsCiclo2';
import * as XLSX from 'xlsx';
import { api } from '../config';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { formatData } from './FormatDataCiclo2';

const Ciclo2Panel = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [formattedData, setFormattedData] = useState([]);
    const [pageSize, setPageSize] = useState(20);
    const [loading, setLoading] = useState(false);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const gridApiRef = useRef(null);
    const gridColumnApiRef = useRef(null);

   
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${api}/despostada?fecha=${formattedDate}`);
                const fetchedData = response.data;
                setData(fetchedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, [formattedDate]);

    useEffect(() => {
        const formatted = formatData(data);
        setFormattedData(formatted);
    }, [data]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    const columnDefs = [
        { headerName: 'Fecha faena', field: 'Fecha de faena', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Hora Ingreso', field: 'Hora de Ingreso', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Tipificación', field: 'Tipificación', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Tropa', field: 'Tropa', width: 80, filter: 'agNumberColumnFilter' },
        { headerName: 'Correlativo', field: 'correlativo', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Lado', field: 'Lado', width: 80, filter: 'agTextColumnFilter' },
        { headerName: 'Cámara', field: 'Cámara', width: 80, filter: 'agTextColumnFilter' },
        { headerName: 'Destino', field: 'Destino comercial', width: 120, filter: 'agTextColumnFilter' },
        { headerName: 'Dientes', field: 'Dientes', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Palco (Kgs)', field: 'Peso de palco', width: 80, filter: 'agNumberColumnFilter' },
        { headerName: 'Peso oreo (Kgs)', field: 'Peso de oreo', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Merma (%)', field: 'Merma de oreo', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Cabezas', field: 'Cabezas', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Peso Tropa (Kgs)', field: 'Peso Tropa', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Horas Oreo', field: 'Horas de oreo', width: 100, filter: 'agNumberColumnFilter' },
    ];
    const defaultColDef = {
        sortable: true,
        resizable: true,
        filter: true,
    };

    const onGridReady = (params) => {
        gridApiRef.current = params.api;
        gridColumnApiRef.current = params.columnApi;
        setPageSize(params.api.paginationGetPageSize());
    };


    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cuarteo');
        XLSX.writeFile(wb, `cuarteo${formattedDate}.xlsx`);
    };

    return (
        <Paper style={{ height: '100%', width: '100%' }}>
            <StatisticsCiclo2 data={data} />
            <Box display="flex" justifyContent="flex-start" mb={2}>
                <Button
                    variant="contained"
                    onClick={handleExport}
                    style={{ backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346', color: data.length === 0 ? '#6b6e6b' : 'white' }}
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
                <div
                    className="ag-theme-alpine"
                    style={{ height: '70vh', width: '100%' }}
                >
                    <AgGridReact
                        rowData={formattedData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        paginationPageSize={pageSize}
                        onGridReady={onGridReady}
                        rowHeight={30}
                            getRowId={(params) => `${params.data["Fecha de faena"]}-${params.data.correlativo}-${params.data.Lado}`}
                        animateRows={true}
                    />
                </div>
            
            )}
        </Paper>
    );
};

export default Ciclo2Panel;
