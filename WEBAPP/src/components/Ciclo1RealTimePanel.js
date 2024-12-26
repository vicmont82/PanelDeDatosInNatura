import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { CircularProgress, Paper, Box } from '@mui/material';
import { format } from 'date-fns';
import { api } from '../config';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { formatData } from './FormatData';

const Ciclo1RealTimePanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(20);
    const formattedDate = useMemo(() => format(new Date(), 'yyyyMMdd'), []);    
    const gridApiRef = useRef(null);
    const gridColumnApiRef = useRef(null);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${api}/romaneos?fecha=${formattedDate}`);
                const formattedData = response.data.map((item) => formatData(item));
                setData(formattedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, [formattedDate]);

    useEffect(() => {
        const eventSource = new EventSource(`${api}/realtime/insert`);

        eventSource.onmessage = (event) => {
            const newRecord = JSON.parse(event.data); 
            const formattedRecord = formatData(newRecord);            
            setData((prevData) => [formattedRecord, ...prevData]);
        };

        return () => {
            eventSource.close(); 
        };
    }, []);

    const columnDefs = [
        { headerName: 'Hora', field: 'Hora', width: 100, filter: 'agTextColumnFilter' },
        { headerName: 'Tropa', field: 'Tropa', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Correlativo', field: 'Correlativo', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Lado', field: 'Lado', width: 70, filter: 'agTextColumnFilter' },
        { headerName: 'Peso (Kgs)', field: 'Peso', width: 100, filter: 'agNumberColumnFilter' },
        { headerName: 'Tipo', field: 'TipoVacuno', width: 120, filter: 'agTextColumnFilter' },
        { headerName: 'Conformación', field: 'Conformación', width: 120, filter: 'agTextColumnFilter' },
        { headerName: 'Cantidad', field: 'Cantidad', width: 120, filter: 'agNumberColumnFilter' },
        { headerName: 'Destino', field: 'Destino', width: 70, filter: 'agTextColumnFilter' },
        { headerName: 'Tipificación', field: 'Tipificación', width: 120, filter: 'agTextColumnFilter' },
        { headerName: 'Raza', field: 'Raza', width: 70, filter: 'agTextColumnFilter' },
        { headerName: 'Rito', field: 'Rito', width: 150, filter: 'agTextColumnFilter' },
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
        <Box width="100%">
            <Paper
                style={{
                    width: '100%',
                    padding: '16px',
                }}
            >
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
                            paginationPageSize={pageSize}
                            onGridReady={onGridReady}
                            rowHeight={30}
                            getRowId={(params) => `${params.data.Hora}-${params.data.Correlativo}-${params.data.Lado}`}
                            animateRows={true}
                        />
                    </div>
                    )}
            </Paper>
        </Box>
    );
};

export default Ciclo1RealTimePanel;
