import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CircularProgress, Paper, Box, Button } from '@mui/material';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import GetAppIcon from '@mui/icons-material/GetApp';
import StatisticsCiclo1 from './StatisticsCiclo1';
import { api } from '../config';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Ciclo1Panel = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(20);
    const formattedDate = format(selectedDate, 'yyyyMMdd');

    const formatDate = (dateStr) => {
        // Extraer año, mes y día del string numérico
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);

        // Retornar el formato "DD-MM-AAAA"
        return `${day}-${month}-${year}`;
    };

    const gridApiRef = useRef(null);
    const gridColumnApiRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${api}/romaneos?fecha=${formattedDate}`);
                const formattedData = response.data.map((item) => ({
                    ...item,
                    "Fecha": formatDate(item["Fecha"]),
                    "Hora": item["Hora"],
                    "Tropa": Number(item["Tropa"]),
                    "Correlativo": Number(item["Correlativo"]),
                    "Lado": item["Lado"],
                    "Peso": Number(item["Peso"]).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                    "Secuencia": item["Secuencia"],
                    "Destino": item["Destino"],
                    "Tipificación": item["Tipificación"],
                    "Conformación": item["Conformación"],
                    "Cantidad": item["Cantidad"],
                    "Tipo": item["Tipo"],
                    "Raza": item["Raza"],
                    "Rito": item["Rito"] === "0" ? 'Convencional' : item["Rito"] === "1" ? 'Kosher' : 'Rechazo Kosher',
                    "Amparo": item["Amparo"],
                    "Amparo Dos": item["Amparo Dos"]
                }));

                setData(formattedData);
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
        XLSX.utils.book_append_sheet(wb, ws, 'Romaneos');
        XLSX.writeFile(wb, `romaneos${formattedDate}.xlsx`);
    };

    const columnDefs = [
        { headerName: 'Fecha', field: 'Fecha', width: 110, filter: 'agNumberColumnFilter' },
        { headerName: 'Hora', field: 'Hora', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Tropa', field: 'Tropa', width: 110, filter: 'agNumberColumnFilter' },
        { headerName: 'Garron', field: 'Correlativo', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Lado', field: 'Lado', width: 70, filter: 'agTextColumnFilter' },
        { headerName: 'Peso', field: 'Peso', width: 110, filter: 'agNumberColumnFilter' },
        { headerName: 'Sec.', field: 'Secuencia', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Conf.', field: 'Conformación', width: 80, filter: 'agTextColumnFilter' },
        { headerName: 'Grasa', field: 'Cantidad', width: 80, filter: 'agNumberColumnFilter' },
        { headerName: 'Tipo', field: 'Tipo', width: 80, filter: 'agTextColumnFilter' },
        { headerName: 'Dest.', field: 'Destino', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Codigo', field: 'Tipificación', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Raza', field: 'Raza', width: 70, filter: 'agTextColumnFilter' },
        { headerName: 'Rito', field: 'Rito', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Amparo', field: 'Amparo', width: 110, filter: 'agTextColumnFilter' },
        { headerName: 'Amparo Dos', field: 'Amparo Dos', width: 110, filter: 'agTextColumnFilter' },
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


    return (
        <Paper style={{ height: '100%', width: '100%' }}>
            <StatisticsCiclo1 data={data} />
            <Box display="flex" justifyContent="flex-start" mb={2}>
                <Button
                    variant="contained"
                    onClick={handleExport}
                    style={{ backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346', color: data.length === 0 ? '#6b6e6b' : 'white', marginBottom: 10 }}
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
                    style={{ height: 600, width: '100%' }}
                >
                    <AgGridReact
                        rowData={data}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        paginationPageSize={pageSize}
                        onGridReady={onGridReady}
                        onPaginationChanged={(params) => setPageSize(params.api.paginationGetPageSize())}
                        rowHeight={30}
                        getRowId={(params) => `${params.data.Correlativo}-${params.data.Lado}`}
                    />
                </div>
            )}
        </Paper>
    );
};

export default Ciclo1Panel;
