import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SearchIcon from '@mui/icons-material/Search';
import GetAppIcon from '@mui/icons-material/GetApp';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { api } from '../config';

const RomaneosTable = () => {
    const [planta, setPlanta] = useState('San Jorge');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [vendedores, setVendedores] = useState([]);
    const [selectedVendedor, setSelectedVendedor] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterModel, setFilterModel] = useState({
        items: [],
    });

    const localeText = {
        noRowsLabel: 'No hay filas',
        noResultsOverlayLabel: 'No se encontraron resultados.',

        toolbarFilters: 'Filtros',
        toolbarFiltersLabel: 'Mostrar filtros',
        toolbarFiltersTooltipHide: 'Ocultar filtros',
        toolbarFiltersTooltipShow: 'Mostrar filtros',
        toolbarQuickFilterPlaceholder: 'Buscar...',
        toolbarQuickFilterLabel: 'Buscar',
        toolbarQuickFilterDeleteIconLabel: 'Limpiar',

        columnsPanelTextFieldLabel: 'Buscar columna',
        columnsPanelTextFieldPlaceholder: 'Título de columna',
        columnsPanelDragIconLabel: 'Reordenar columna',
        columnsPanelShowAllButton: 'Mostrar todas',
        columnsPanelHideAllButton: 'Ocultar todas',

        filterPanelAddFilter: 'Añadir filtro',
        filterPanelDeleteIconLabel: 'Eliminar',
        filterPanelLogicOperator: 'Operador lógico',
        filterPanelOperator: 'Operador',
        filterPanelOperatorAnd: 'Y',
        filterPanelOperatorOr: 'O',
        filterPanelColumns: 'Columnas',
        filterPanelInputLabel: 'Valor',
        filterPanelInputPlaceholder: 'Valor de filtro',

        filterOperatorContains: 'contiene',
        filterOperatorEquals: 'es igual a',
        filterOperatorStartsWith: 'empieza con',
        filterOperatorEndsWith: 'termina con',
        filterOperatorIs: 'es',
        filterOperatorNot: 'no es',
        filterOperatorAfter: 'después de',
        filterOperatorOnOrAfter: 'en o después de',
        filterOperatorBefore: 'antes de',
        filterOperatorOnOrBefore: 'en o antes de',
        filterOperatorIsEmpty: 'está vacío',
        filterOperatorIsNotEmpty: 'no está vacío',
        filterOperatorIsAnyOf: 'es cualquiera de',

        checkboxSelectionHeaderName: 'Selección',
        checkboxSelectionSelectAllRows: 'Seleccionar todas las filas',
        checkboxSelectionUnselectAllRows: 'Deseleccionar todas las filas',
        checkboxSelectionSelectRow: 'Seleccionar fila',
        checkboxSelectionUnselectRow: 'Deseleccionar fila',

        columnHeaderFiltersTooltipActive: (count) =>
            count !== 1 ? `${count} filtros activos` : `${count} filtro activo`,
        columnMenuLabel: 'Menú',
        columnMenuShowColumns: 'Mostrar columnas',
        columnMenuFilter: 'Filtrar',
        columnMenuHideColumn: 'Ocultar',
        columnMenuUnsort: 'Desordenar',
        columnMenuSortAsc: 'Ordenar ascendentemente',
        columnMenuSortDesc: 'Ordenar descendentemente',

        columnHeaderSortIconLabel: 'Ordenar',

        footerRowSelected: (count) =>
            count !== 1
                ? `${count.toLocaleString()} filas seleccionadas`
                : `${count.toLocaleString()} fila seleccionada`,
        footerTotalRows: 'Filas Totales:',

        footerPaginationRowsPerPage: 'Filas por página:',

        preferencesPanelOpen: 'Abrir panel de preferencias',
        preferencesPanelClose: 'Cerrar panel de preferencias',

        toolbarDensity: 'Densidad',
        toolbarDensityLabel: 'Densidad',
        toolbarDensityCompact: 'Compacta',
        toolbarDensityStandard: 'Estándar',
        toolbarDensityComfortable: 'Cómoda',

        toolbarExport: 'Exportar',
        toolbarExportLabel: 'Exportar',
        toolbarExportCSV: 'Descargar como CSV',
        toolbarExportPrint: 'Imprimir',
    };

    const handlePlantaChange = (selectedPlanta) => {
        setPlanta(selectedPlanta);
    };

    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const response = await axios.get(`${api}/vendedores`);
                const vendedoresFiltrados = response.data
                    .filter(v => v.vendedor) 
                    .map(v => v.vendedor);
                setVendedores(vendedoresFiltrados);
            } catch (error) {
                console.error('Error al obtener los vendedores:', error);
                alert('Error al obtener los vendedores.');
            }
        };
        fetchVendedores();
    }, []);

    const fetchData = async () => {
        if (!startDate || !endDate) {
            alert('Por favor, seleccione las fechas de inicio y fin.');
            return;
        }

        try {
            setLoading(true);

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];
            const vendedorParam = selectedVendedor ? selectedVendedor : null;

            const params = {
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                planta: planta,
            };

            if (vendedorParam) {
                params.vendedor = vendedorParam;
            }

            const response = await axios.get(`${api}/hacienda`, {
                params: params,
            });

            const keyMapping = {
                'Correlativo': 'correlativo',
                'Fecha de Faena': 'fechaFaena',
                'Peso de Palco': 'pesoPalco',
                'Código de Palco': 'codigoPalco',
                'Tipo de Vacuno': 'tipoVacuno',
                'Tropa': 'tropa',
                'Lado': 'lado',
                'Destino': 'destino',
                'Calidad': 'calidad',
                'Grasa': 'grasa',
                'Vendedor': 'vendedor',
                'Consignatario': 'consignatario',
                'Peso Tropa': 'pesoTropa',
                'Cantidad de Cabezas': 'cantidadCabezas',
                'Peso Total por Tropa': 'pesoTotalTropa',
                'Peso Digestores': 'pesoDigestores',
            };



            const adjustedData = response.data.map((item, index) => {
                const newItem = { id: index };
                Object.keys(item).forEach((key) => {
                    const newKey = keyMapping[key] || key;

                    if (['pesoPalco', 'pesoTropa', 'pesoTotalTropa'].includes(newKey)) {
                        const numericValue = Number(item[key]);
                        newItem[newKey] = isNaN(numericValue)
                            ? item[key] 
                            : numericValue.toLocaleString('es-ES', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            });
                    } else {
                        newItem[newKey] = item[key];
                    }
                });
                return newItem;
            });

            setData(adjustedData);

        } catch (error) {
            console.error('Error al obtener los datos:', error);
            alert('Error al obtener los datos.');
        } finally {
            setLoading(false);
        }
    };
    const composeDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`
    }

    const exportToExcel = () => {
        if (data.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Romaneos');
        XLSX.writeFile(workbook, `romaneos${composeDate(startDate)}a${composeDate(endDate)}.xlsx`);
    };
    
    const columns = [
        { field: 'correlativo', headerName: 'Correlativo', width: 100 },
        { field: 'fechaFaena', headerName: 'Fecha de Faena', width: 120 },
        { field: 'pesoPalco', headerName: 'Peso de Palco', width: 130 },
        { field: 'codigoPalco', headerName: 'Código de Palco', width: 130 },
        { field: 'tipoVacuno', headerName: 'Tipo de Vacuno', width: 130 },
        { field: 'tropa', headerName: 'Tropa', width: 100 },
        { field: 'lado', headerName: 'Lado', width: 80 },
        { field: 'destino', headerName: 'Destino', width: 100 },
        { field: 'calidad', headerName: 'Calidad', width: 100 },
        { field: 'grasa', headerName: 'Grasa', width: 80 },
        { field: 'vendedor', headerName: 'Vendedor', width: 200 },
        { field: 'consignatario', headerName: 'Consignatario', width: 200 },
        { field: 'pesoTropa', headerName: 'Peso Tropa', width: 130 },
        { field: 'cantidadCabezas', headerName: 'Cantidad de Cabezas', width: 150 },
        { field: 'pesoTotalTropa', headerName: 'Peso Total por Tropa', width: 180 },
        { field: 'pesoDigestores', headerName: 'Peso Digestores', width: 180 }, 
    ];



    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Datos de Hacienda
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                        Seleccione Planta:
                    </Typography>
                    <Button
                        variant={planta === 'San Jorge' ? 'contained' : 'outlined'}
                        onClick={() => handlePlantaChange('San Jorge')}
                        sx={{ mr: 1 }}
                    >
                        San Jorge
                    </Button>
                    <Button
                        variant={planta === 'Villa Mercedes' ? 'contained' : 'outlined'}
                        onClick={() => handlePlantaChange('Villa Mercedes')}
                    >
                        Villa Mercedes
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 2 }}>
                        <DatePicker
                            label="Fecha de Inicio"
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
                        />
                        <DatePicker
                            sx={{ marginLeft: 2}}
                            label="Fecha de Fin"
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </Box>

                    <Box sx={{ width: 300, mr: 2, mb: 2 }}>
                        <Autocomplete
                            options={vendedores}
                            getOptionLabel={(option) => option} 
                            value={selectedVendedor}
                            onChange={(event, newValue) => setSelectedVendedor(newValue)}
                            renderInput={(params) => <TextField {...params} label="Seleccionar Vendedor" variant="outlined" />}
                            isOptionEqualToValue={(option, value) => option === value} 
                            clearOnEscape
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={fetchData}
                            startIcon={<SearchIcon />}
                            sx={{ mr: 2 }}
                        >
                            Buscar
                        </Button>
                        <Button
                            style={{ backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346', color: data.length === 0 ? '#6b6e6b' : 'white' }}
                            variant="contained"
                            onClick={exportToExcel}
                            disabled={data.length === 0}
                            startIcon={<GetAppIcon />}
                        >
                            Exportar a Excel
                        </Button>
                    </Box>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                        <CircularProgress />
                    </Box>
                ) : data.length > 0 ? (
                    <div style={{ height: '70vh', width: '100%' }}>
                        <DataGrid
                            rows={data}
                            columns={columns}
                            pageSize={50}
                            rowsPerPageOptions={[50, 75, 100]}
                            components={{
                                Toolbar: GridToolbar,
                            }}
                            filterModel={filterModel}
                            onFilterModelChange={(model) => setFilterModel(model)}
                            localeText={localeText}
                            density="compact"
                        />
                    </div>
                ) : (
                    <Typography variant="body1">No se encontraron datos.</Typography>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default RomaneosTable;
