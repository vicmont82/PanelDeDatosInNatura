import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import * as XLSX from 'xlsx';
import { api } from '../config';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';

const ListaMatanzaPanel = ({ selectedDate }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(20); 
    const gridApiRef = useRef(null);
    const gridColumnApiRef = useRef(null);

    const localeText = {
        noRowsLabel: 'No hay filas',
        noResultsOverlayLabel: 'No se encontraron resultados.',

        selectAll: 'Seleccionar todo',
        searchOoo: 'Buscar...',
        blanks: 'Blancos',

        columnMenuShowColumns: 'Mostrar columnas',
        columnMenuFilter: 'Filtrar',
        columnMenuHideColumn: 'Ocultar',
        columnMenuSortAsc: 'Ordenar ascendentemente',
        columnMenuSortDesc: 'Ordenar descendentemente',

        columnHeaderSortAscending: 'Ordenar ascendentemente',
        columnHeaderSortDescending: 'Ordenar descendentemente',
        columnHeaderSortNone: 'No ordenar',

        footerTotalRows: 'Filas Totales:',
        footerSelectedRows: (count) =>
            count !== 1 ? `${count.toLocaleString()} filas seleccionadas` : `${count.toLocaleString()} fila seleccionada`,

        paginationPageSize: 'Filas por página:',
        paginationGotoNextPage: 'Ir a la página siguiente',
        paginationGotoPreviousPage: 'Ir a la página anterior',
        paginationGotoFirstPage: 'Ir a la primera página',
        paginationGotoLastPage: 'Ir a la última página',
        paginationLabelDisplayedRows: '{from} - {to} de {count}',
    };

    const columnDefs = [
        { headerName: 'Orden', field: 'orden', width: 120, sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'Tropa', field: 'tropa', width: 110, sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'Cabezas', field: 'cabezas', width: 110, sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'Tipo', field: 'tipo', width: 110, sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Fecha', field: 'fecha', width: 110, sortable: true, filter: 'agDateColumnFilter' },
        { headerName: 'Vendedor', field: 'vendedor', width: 250, sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Consignatario', field: 'consignatario', width: 110, sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Localidad', field: 'localidad', width: 110, sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Peso', field: 'peso', width: 110, sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'Corral', field: 'corral', width: 110, sortable: true, filter: 'agTextColumnFilter' },
        {
            headerName: 'Rango',
            valueGetter: (params) => {
                const inicia = params.data.inicia || '';
                const finaliza = params.data.finaliza || '';
                return `${inicia}-${finaliza}`;
            },
            width: 150,
            sortable: true,
            filter: 'agTextColumnFilter'
        }
    ];
    const defaultColDef = {
        sortable: true,
        resizable: true,
        filter: true,
    };

    const handleExport = () => {
        if (data.length === 0) return;

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Lista de Matanza');
        XLSX.writeFile(wb, 'lista_matanza.xlsx');
    };

    const fetchData = async (formattedDate) => {
        setLoading(true);
        try {
            const response = await fetch(`${api}/listamatanza?fecha=${formattedDate}`);
            if (!response.ok) {
                throw new Error('Error al obtener los datos');
            }
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}${month}${day}`;
            fetchData(formattedDate);
        }
    }, [selectedDate]);

    const onGridReady = (params) => {
        gridApiRef.current = params.api;
        gridColumnApiRef.current = params.columnApi;
        setPageSize(params.api.paginationGetPageSize());
    };


    return (
        <Box sx={{ padding: 2 }}>
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Button
                        variant="contained"
                        onClick={handleExport}
                        style={{
                            backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346',
                            color: data.length === 0 ? '#6b6e6b' : 'white',
                            marginBottom: 10,
                        }}
                        disabled={data.length === 0}
                        startIcon={<GetAppIcon />}
                    >
                        Exportar a Excel
                    </Button>

                    
                    <div className="ag-theme-alpine" style={{ height: 800, width: '100%' }}>
                        <AgGridReact
                            rowData={data}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            pagination={true}
                            paginationPageSize={pageSize}
                            onGridReady={onGridReady}
                            getRowId={(params) => params.data.orden.toString()}
                            localeText={localeText}
                            rowHeight={35}
                            animateRows={true}
                        />
                    </div>
                </>
            )}
        </Box>
    );
};

export default ListaMatanzaPanel;
