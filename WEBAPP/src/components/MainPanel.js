import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import Ciclo1Panel from './Ciclo1Panel';
import Ciclo2Panel from './Ciclo2Panel';
import CajasPanel from './CajasPanel';
import StockCamarasPanel from './StockCamarasPanel';
import ListaMatanzaPanel from './ListaMatanzaPanel';
import RomaneosTable from './DatosHaciendaPanel';
import LlenadoCamarasPanel from './LlenadoCamarasPanel'
import ControlTower from './ControlTower';
import DatosPlaneamiento from './DatosPlaneamiento';
import PanelMermaCamaras from './TopTenMermas';

const MainPanel = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedPanel, setSelectedPanel] = useState('Ciclo 1');

    const renderSelectedPanel = () => {
        switch (selectedPanel) {
            case 'Ciclo 1':
                return <Ciclo1Panel selectedDate={selectedDate} />;
            case 'Ciclo 2':
                return <Ciclo2Panel selectedDate={selectedDate} />;
            case 'Cajas':
                return <CajasPanel selectedDate={selectedDate} />;
            case 'Stock':
                return <StockCamarasPanel />;
            case 'Llenado de Cámaras': 
                return <LlenadoCamarasPanel startDate={startDate} endDate={endDate}  />;
            case 'Lista de Matanza':
                return <ListaMatanzaPanel selectedDate={selectedDate} />;
            case 'Romaneos':
                return <RomaneosTable />;
            case 'Palco':
                return <ControlTower />;
            case 'Planeamiento':
                return <DatosPlaneamiento selectedDate={selectedDate} />;
            case 'Merma 10%':
                return <PanelMermaCamaras selectedDate={selectedDate} />;
            default:
                return null;
        }
    };

    const handlePanelChange = (panel) => {
        setSelectedPanel(panel);
        setSelectedDate(new Date());
        setStartDate(null);
        setEndDate(null);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ p: 2 }}>
                <Button
                    variant={selectedPanel === 'Palco' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Palco')}
                    sx={{ marginRight: 1 }}
                >
                    Palco en vivo
                </Button>
                <Button
                    variant={selectedPanel === 'Ciclo 1' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Ciclo 1')}
                    sx={{ marginRight: 1 }}
                >
                    Tipificación
                </Button>
                <Button
                    variant={selectedPanel === 'Ciclo 2' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Ciclo 2')}
                    sx={{ marginRight: 1 }}
                >
                    Ingreso a Cuarteo
                </Button>
                <Button
                    variant={selectedPanel === 'Merma 10%' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Merma 10%')}
                    sx={{ marginRight: 1 }}
                >
                    Merma inicial 10%
                </Button>
                <Button
                    variant={selectedPanel === 'Cajas' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Cajas')}
                    sx={{ marginRight: 1 }}
                >
                    Producción de cortes
                </Button>
                <Button
                    variant={selectedPanel === 'Stock' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Stock')}
                    sx={{ marginRight: 1 }}
                >
                    Stock de medias en cámaras
                </Button>
                <Button
                    variant={selectedPanel === 'Lista de Matanza' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Lista de Matanza')}
                    sx={{ marginRight: 1 }}
                >
                    Lista de Matanza
                </Button>
                <Button
                    variant={selectedPanel === 'Llenado de Cámaras' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Llenado de Cámaras')}
                    sx={{ marginRight: 1 }}
                >
                    Llenado de Cámaras
                </Button>
                <Button
                    variant={selectedPanel === 'Planeamiento' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Planeamiento')}
                    sx={{ marginRight: 1 }}
                >
                    Datos Planeamiento
                </Button>
                <Button
                    variant={selectedPanel === 'Romaneos' ? 'contained' : 'outlined'}
                    onClick={() => handlePanelChange('Romaneos')}
                    sx={{ marginRight: 1 }}
                >
                    Datos Hacienda
                </Button>

                {selectedPanel !== 'Stock' && selectedPanel !== 'Romaneos' && selectedPanel !== 'Palco' && (
                    <Box sx={{ mt: 2 }}>
                        {selectedPanel === 'Llenado de Cámaras' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DatePicker
                                    label="Fecha Inicio"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{ textField: { variant: 'outlined', label: 'Seleccione fecha' } }}
                                />
                                <Box sx={{ mx: 2 }}> 
                                    a 
                                </Box>
                                <DatePicker
                                    label="Fecha Fin"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{ textField: { variant: 'outlined', label: 'Seleccione fecha' } }}
                                />
                            </Box>
                        ) : (
                            <DatePicker
                                label="Seleccione Fecha"
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                inputFormat="dd-MM-yyyy"
                                mask="__-__-____"
                                    slotProps={{ textField: { variant: 'outlined', label: 'Seleccione fecha' } }}
                            />
                        )}
                    </Box>
                )}

                <Box sx={{ mt: 2 }}>
                    {renderSelectedPanel()}
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default MainPanel;
