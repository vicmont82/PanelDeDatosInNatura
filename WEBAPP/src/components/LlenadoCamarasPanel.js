import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import GetAppIcon from '@mui/icons-material/GetApp';
import axios from 'axios';
import { api } from '../config';

import { AgGridReact } from 'ag-grid-react'; 
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css'; 

const LlenadoDeCamarasPanel = ({ startDate, endDate }) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);

    const gridApiRefs = useRef({});

    useEffect(() => {
        const fetchData = async () => {
            if (!startDate || !endDate || !shouldFetch) {
                console.log('Faltan datos');
                return;
            }

            try {
                setLoading(true);

                const formattedStartDate = format(startDate, 'yyyy-MM-dd');
                const formattedEndDate = format(endDate, 'yyyy-MM-dd');

                const endpointUrl = `${api}/llenadoCamaras?fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`;
                console.log('Llamando al endpoint:', endpointUrl);

                const response = await axios.get(endpointUrl);

                const records = response.data;

                if (!records || records.length === 0) {
                    console.warn('No se recibieron datos del endpoint.');
                    setData({});
                    return;
                }

                const groupedData = {};

                for (const record of records) {
                    const { Camara, Tropa, Fecha, Amparos, Tipos, Texto } = record;

                    const fechaFormateada = format(new Date(Fecha), 'yyyy/MM/dd');

                    if (!groupedData[fechaFormateada]) {
                        groupedData[fechaFormateada] = {};
                    }

                    if (!groupedData[fechaFormateada][Camara]) {
                        groupedData[fechaFormateada][Camara] = {};
                    }

                    if (!groupedData[fechaFormateada][Camara][Tropa]) {
                        groupedData[fechaFormateada][Camara][Tropa] = {
                            Camara,
                            Tropa,
                            Fecha,
                            Amparos,
                            Tipos,
                            Texto,
                        };
                    }
                }

                setData(groupedData);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            } finally {
                setLoading(false);
                setShouldFetch(false);
            }
        };

        fetchData();
    }, [startDate, endDate, shouldFetch]);

    const handleProcess = () => {
        setShouldFetch(true);
        console.log('Botón "Procesar" presionado. Iniciando solicitud al endpoint...');
    };

    const exportToExcel = () => {
        const exportData = [];

        // Recorre cada fecha y cámara
        for (const fecha in data) {
            for (const camara in data[fecha]) {
                const gridApi = gridApiRefs.current[`${fecha}-${camara}`];
                if (gridApi) {
                    // Obtiene las filas seleccionadas
                    const selectedNodes = gridApi.getSelectedNodes();
                    const selectedData = selectedNodes.map((node) => node.data);

                    selectedData.forEach((row) => {
                        const baseData = {
                            Fecha: format(new Date(row.fecha), 'dd/MM/yyyy'),
                            Cámara: row.camara,
                            Tropa: row.tropa,
                            'Carga Manual': row.Texto,
                        };

                        let amparosStr = '';
                        if (row.Amparos && row.Amparos.length > 0) {
                            amparosStr = row.Amparos
                                .map(
                                    (amparo) =>
                                        `${amparo.NombreAmparo}: ${amparo.TotalMediasAmp} Medias`
                                )
                                .join('; ');
                        }

                        let tiposStr = '';
                        if (row.Tipos && row.Tipos.length > 0) {
                            tiposStr = row.Tipos
                                .map(
                                    (tipo) =>
                                        `${tipo.TipovacDescripcion}: ${tipo.TotalAnimalesTipo} animales`
                                )
                                .join('; ');
                        }

                        exportData.push({
                            ...baseData,
                            Amparos: amparosStr,
                            'Tipos de Vacuno': tiposStr,
                        });
                    });
                }
            }
        }

        if (exportData.length === 0) {
            alert('No hay filas seleccionadas para exportar.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            `LlenadoCamaras_${Date.now()}`
        );

        XLSX.writeFile(
            workbook,
            `llenadoDeCamaras_${format(startDate, 'dd-MM-yyyy')}_${format(
                endDate,
                'dd-MM-yyyy'
            )}.xlsx`
        );
    };

  
    const columnDefs = useMemo(
        () => [
            {
                headerName: '',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 50,
                pinned: 'left',
            },
            {
                headerName: 'Fecha',
                field: 'fecha',
                valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy'),
                sortable: true,
                filter: true,
            },
            {
                headerName: 'Cámara',
                field: 'camara',
                sortable: true,
                filter: true,
            },
            {
                headerName: 'Tropa',
                field: 'tropa',
                sortable: true,
                filter: true,
            },
            {
                headerName: 'Amparos',
                field: 'Amparos',
                cellRenderer: (params) => {
                    if (params.value && params.value.length > 0) {
                        return params.value
                            .map(
                                (amparo) =>
                                    `${amparo.NombreAmparo}: ${amparo.TotalMediasAmp} Medias`
                            )
                            .join('; ');
                    }
                    return '';
                },
            },
            {
                headerName: 'Tipos de Vacuno',
                field: 'Tipos',
                cellRenderer: (params) => {
                    if (params.value && params.value.length > 0) {
                        return params.value
                            .map(
                                (tipo) =>
                                    `${tipo.TipovacDescripcion}: ${tipo.TotalAnimalesTipo} animales`
                            )
                            .join('; ');
                    }
                    return '';
                },
            },
            {
                headerName: 'Carga Manual',
                field: 'Texto',
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            sortable: true,
            filter: true,
        }),
        []
    );

    const getRowDataForDateAndCamera = (fecha, camara) => {
        const tempRows = [];
        for (const tropa in data[fecha][camara]) {
            const troopData = data[fecha][camara][tropa];
            tempRows.push({
                fecha,
                camara,
                tropa,
                ...troopData,
            });
        }
        return tempRows;
    };

    return (
        <Box>
            <Button
                variant="contained"
                color="primary"
                onClick={handleProcess}
                sx={{ mb: 2 }}
            >
                Procesar
            </Button>

            {loading ? (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="50vh"
                >
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {Object.keys(data).length === 0 ? (
                        <Typography variant="h6">
                            No se encontraron datos para las fechas seleccionadas.
                        </Typography>
                    ) : (
                        <>
                            <Button
                                style={{
                                    backgroundColor: '#217346',
                                    color: 'white',
                                }}
                                variant="contained"
                                onClick={exportToExcel}
                                sx={{ mb: 2, ml: 2 }}
                                startIcon={<GetAppIcon />}
                            >
                                Exportar a Excel
                            </Button>

                            {Object.keys(data).map((fecha) => (
                                <Paper key={fecha} sx={{ mb: 4, p: 2 }}>
                                    <Typography variant="h5" sx={{ mb: 2 }}>
                                        Fecha: {format(new Date(fecha), 'dd/MM/yyyy')}
                                    </Typography>

                                    {Object.keys(data[fecha]).map((camara) => (
                                        <Paper
                                            key={camara}
                                            sx={{ mb: 4, p: 2, backgroundColor: '#f5f5f5' }}
                                        >
                                            <Typography variant="h6" sx={{ mb: 2 }}>
                                                Cámara: {camara}
                                            </Typography>

                                            <div
                                                className="ag-theme-alpine"
                                                style={{ height: 300, width: '100%' }}
                                            >
                                                <AgGridReact
                                                    rowData={getRowDataForDateAndCamera(
                                                        fecha,
                                                        camara
                                                    )}
                                                    columnDefs={columnDefs}
                                                    defaultColDef={defaultColDef}
                                                    rowSelection="multiple"
                                                    onGridReady={(params) => {
                                                        gridApiRefs.current[
                                                            `${fecha}-${camara}`
                                                        ] = params.api;
                                                    }}
                                                />
                                            </div>
                                        </Paper>
                                    ))}
                                </Paper>
                            ))}
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

export default LlenadoDeCamarasPanel;
