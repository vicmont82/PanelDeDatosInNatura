import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Paper, CircularProgress, Box, Button } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { format } from 'date-fns';
import StatisticsPanelDesp from './StatisticsPanelDesp';
import { api } from '../config';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css'; 
import { formatData } from './FormatDataCajas'; 
import * as XLSX from 'xlsx';

const CajasPanel = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(20);
    const formattedDate = format(selectedDate, 'yyyyMMdd');
    const [gridReady, setGridReady] = useState(false);

    const gridApiRef = useRef(null);
    const gridColumnApiRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${api}/cajas?fecha=${formattedDate}`);
                const fetchedData = response.data;
                const formatted = formatData(fetchedData);
                setData(formatted);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, [formattedDate, gridReady]);


    const columnDefs = [
        { headerName: 'Nro de Caja', field: 'nro de caja', width: 120, filter: 'agTextColumnFilter' },
        {
            headerName: 'Fecha Producción',
            field: 'Fecha de producción',
            width: 120,
            filter: 'agDateColumnFilter',
            sortable: true,
            comparator: (dateA, dateB) => {
                const a = new Date(dateA);
                const b = new Date(dateB);
                return a - b;
            },
        },
        { headerName: 'Hora Producción', field: 'Hora de producción', width: 120 , filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Código', field: 'Codigo de producto', width: 100, filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Producto', field: 'Producto', width: 250, filter: 'agTextColumnFilter', sortable: true },
        { headerName: 'Peso Bruto', field: 'Peso bruto', width: 120, filter: 'agNumberColumnFilter', sortable: true },
        { headerName: 'Peso Neto', field: 'Peso Neto', width: 120, filter: 'agNumberColumnFilter', sortable: true },
        {
            headerName: 'Fecha Faena',
            field: 'Fecha faena',
            width: 120,
            filter: 'agDateColumnFilter',
            sortable: true,
            comparator: (dateA, dateB) => {
                const a = new Date(dateA);
                const b = new Date(dateB);
                return a - b;
            },
        },
        {
            headerName: 'Tropa',
            field: 'Tropa',
            width: 100,
            filter: 'agTextColumnFilter',
            filterParams: {
                textMatcher: ({ filterText, value }) => {
                    if (Array.isArray(value)) {
                        return value.some((item) => item.toString().toLowerCase().includes(filterText.toLowerCase()));
                    }
                    return value?.toString().toLowerCase().includes(filterText.toLowerCase());
                },
            },
            sortable: true,
            valueFormatter: (params) => {
                const { value } = params;
                if (Array.isArray(value)) {
                    return value.join(',');
                }
                return value !== undefined && value !== null ? value.toString() : '';
            },
        },
        { headerName: 'Lote', field: 'Lote', width: 100, filter: 'agTextColumnFilter', sortable: true },
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
        setGridReady(true);
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cajas');
        XLSX.writeFile(wb, `cajas_${formattedDate}.xlsx`);
    };

    return (
        <Paper sx={{ padding: 2 }}>
            <StatisticsPanelDesp data={data} />
            <Box display="flex" justifyContent="flex-start" mb={2}>
                <Button
                    variant="contained"
                    onClick={handleExport}
                    style={{
                        backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346',
                        color: data.length === 0 ? '#6b6e6b' : 'white',
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
                
                    <div
                        className="ag-theme-alpine"
                        style={{ height: '70vh', width: '100%' }}
                    >
                        <AgGridReact
                            rowData={data}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            pagination={true}
                            onGridReady={onGridReady}
                            paginationPageSize={pageSize}
                            rowHeight={30}
                            getRowId={(params) => `${params.data.correlativo}-${params.data.Lote}`}
                            animateRows={true}
                        />
                    </div>
               
            )}
        </Paper>
    );
};

export default CajasPanel;
