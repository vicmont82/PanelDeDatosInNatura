import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import CustomModal from './CustomModal';
import { Button } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';



const StockEnCamaras = ({ data }) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedTropa, setSelectedTropa] = useState(null);
    const [unidadesTotales, setUnidadesTotales] = useState(0);
    const [sinCamaraModalIsOpen, setSinCamaraModalIsOpen] = useState(false);
    const [digestoresModalIsOpen, setDigestoresModalIsOpen] = useState(false);
    const [mediasConsumoModal, setMediasConsumoModal] = useState(false);
    const [sinCamaraData, setSinCamaraData] = useState([]);
    const [digestoresData, setDigestoresData] = useState([]);
    const [detailModalIsOpen, setDetailModalIsOpen] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [mediasConsumoData, setMediasConsumoData] = useState([]);
    const [selectedCamara, setSelectedCamara] = useState(null);

    useEffect(() => {
        const sinCamara = data.filter(item => !item["Cámara"]);
        setSinCamaraData(sinCamara);

        const digestores = data.filter(item => item["Destino comercial"] === 'XD');
        setDigestoresData(digestores);

        const filteredData = data.filter(item => item["Destino comercial"] !== 'XD');
        setFilteredData(filteredData);

        const mediasConsumo = data.filter(item => item["Destino comercial"] === 'ZZ');
        setMediasConsumoData(mediasConsumo);
    }, [data]);

    
    const groupedData = filteredData.reduce((acc, item) => {
        let camara = item["Cámara"];
        const tropa = item["Tropa"];
        const fechaIngreso = item["Fecha de faena"];
        const peso = parseFloat(item["Peso"]);

        if (!camara) {
            return acc;
        }

        if (!acc[camara]) {
            acc[camara] = { tropas: {}, totalPeso: 0, maxPeso: peso, minPeso: peso, totalMedias: 0 };
        }
        if (!acc[camara].tropas[tropa]) {
            acc[camara].tropas[tropa] = { items: [], fechaIngreso };
        }

        acc[camara].tropas[tropa].items.push(item);
        acc[camara].totalPeso += peso;
        acc[camara].totalMedias += 1;
        acc[camara].maxPeso = Math.max(acc[camara].maxPeso, peso);
        acc[camara].minPeso = Math.min(acc[camara].minPeso, peso);

        return acc;
    }, {});

    const openModal = (tropa, items) => {
        setSelectedTropa({ tropa, items });
        setUnidadesTotales(items.length);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedTropa(null);
        setUnidadesTotales(0);
    };

    const openSinCamaraModal = () => {
        setSinCamaraModalIsOpen(true);
    };

    const closeSinCamaraModal = () => {
        setSinCamaraModalIsOpen(false);
    };

    const openDigestoresModal = () => {
        setDigestoresModalIsOpen(true);
    };

    const openMediasConsumoModal = () => {
        setMediasConsumoModal(true);
    };

    const closeMediasConsumoModal = () => {
        setMediasConsumoModal(false);
    };

    const closeDigestoresModal = () => {
        setDigestoresModalIsOpen(false);
    };

    const openDetailModal = () => {
        setDetailModalIsOpen(true);
    };

    const closeDetailModal = () => {
        setDetailModalIsOpen(false);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock de Cámaras");
        XLSX.writeFile(workbook, "stock_camaras.xlsx");
    };

    const formatFechaFaena = (fechaFaena) => {
        if (!fechaFaena) return '';
        const year = fechaFaena.slice(0, 4);
        const month = fechaFaena.slice(4, 6);
        const day = fechaFaena.slice(6, 8);
        return `${day}/${month}/${year}`;
    };

    const openCamaraModal = (camara) => {
        setSelectedCamara({ ...groupedData[camara], numero: camara });
    };

    const closeCamaraModal = () => {
        setSelectedCamara(null);
    };

    const groupedSinCamaraData = sinCamaraData.reduce((acc, item) => {
        const tropa = item["Tropa"];
        if (!acc[tropa]) {
            acc[tropa] = [];
        }
        acc[tropa].push(item);
        return acc;
    }, {});

    const groupedDigestoresData = digestoresData.reduce((acc, item) => {
        const tropa = item["Tropa"];
        if (!acc[tropa]) {
            acc[tropa] = [];
        }
        acc[tropa].push(item);
        return acc;
    }, {});

    const groupedMediasConsumoData = mediasConsumoData.reduce((acc, item) => {
        const tropa = item["Tropa"];
        if (!acc[tropa]) {
            acc[tropa] = [];
        }
        acc[tropa].push(item);
        return acc;
    }, {})
    

    const sortedCameras = Object.keys(groupedData).sort((a, b) => {
        const dateA = Math.min(...Object.values(groupedData[a].tropas).flatMap(group => group.items.map(item => item["Fecha de faena"])));
        const dateB = Math.min(...Object.values(groupedData[b].tropas).flatMap(group => group.items.map(item => item["Fecha de faena"])));
        return dateB - dateA;
    });

    return (
        <div>
            <h3>Datos Agrupados por Cámara</h3>
            <div style={{ marginBottom: '10px' }}>
                <Button onClick={openSinCamaraModal} style={{ marginRight: '10px' }}>
                    Ver Medias Sin Cámara
                </Button>
                <Button onClick={openDigestoresModal} style={{ marginRight: '10px' }}>
                    Ver Medias Digestores
                </Button>
                 <Button onClick={openMediasConsumoModal} style={{ marginRight: '10px' }}>
                    Ver Medias consumo
                </Button>
                <Button
                    variant="contained"
                    onClick={exportToExcel}
                    style={{ backgroundColor: data.length === 0 ? '#a2a3a2' : '#217346', color: data.length === 0 ? '#6b6e6b' : 'white' }}
                    disabled={data.length === 0}
                    startIcon={<GetAppIcon />}
                >
                    Exportar a Excel
                </Button>
                
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', maxWidth: '100%' }}>
                {sortedCameras.map(camara => (
                    <div
                        key={camara}
                        style={{
                            border: '1px solid #ccc',
                            marginBottom: '10px',
                            padding: '10px',
                            width: '300px',
                        }}
                    >
                        <h4
                            style={{ cursor: 'pointer', color: 'blue' }}
                            onClick={() => openCamaraModal(camara)}
                        >
                            Cámara {camara}
                        </h4>
                        {Object.keys(groupedData[camara].tropas).map(tropaKey => {
                            const { items, fechaIngreso } = groupedData[camara].tropas[tropaKey];
                            const formattedFechaIngreso = formatFechaFaena(fechaIngreso);
                            return (
                                <div
                                    key={tropaKey}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid #ddd',
                                        padding: '5px',
                                        marginBottom: '5px'
                                    }}
                                >
                                    <div
                                        style={{
                                            cursor: 'pointer',
                                            color: 'blue',
                                            marginBottom: '5px'
                                        }}
                                        onClick={() => openModal(tropaKey, items)}
                                    >
                                        Tropa - {tropaKey}
                                    </div>
                                    <div>
                                        {formattedFechaIngreso}
                                    </div>
                                </div>

                            );
                        })}
                    </div>
                ))}
            </div>

            {selectedCamara && (
                <CustomModal
                    isOpen={!!selectedCamara}
                    onRequestClose={closeCamaraModal}
                    title={`Detalles de la Cámara ${selectedCamara.numero}`}
                >
                    <p><strong>Número de Cámara:</strong> {selectedCamara.numero}</p>
                    <p><strong>Total de Medias:</strong> {selectedCamara.totalMedias}</p>
                    <p><strong>Peso Total:</strong> {selectedCamara.totalPeso.toFixed(2)} kg</p>
                    <p><strong>Peso Máximo:</strong> {selectedCamara.maxPeso.toFixed(2)} kg</p>
                    <p><strong>Peso Mínimo:</strong> {selectedCamara.minPeso.toFixed(2)} kg</p>
                </CustomModal>
            )}

            <CustomModal
                isOpen={sinCamaraModalIsOpen}
                onRequestClose={closeSinCamaraModal}
                title="Medias Sin Cámara"
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.keys(groupedSinCamaraData).map(tropaKey => {
                        const items = groupedSinCamaraData[tropaKey];
                        return (
                            <div
                                key={tropaKey}
                                style={{
                                    cursor: 'pointer',
                                    color: 'blue',
                                    border: '1px solid #ddd',
                                    padding: '5px',
                                    marginBottom: '5px'
                                }}
                                onClick={() => openModal(tropaKey, items)}
                            >
                                Tropa {tropaKey}
                            </div>
                        );
                    })}
                </div>
            </CustomModal>

            <CustomModal
                isOpen={digestoresModalIsOpen}
                onRequestClose={closeDigestoresModal}
                title="Medias Digestores"
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.keys(groupedDigestoresData).map(tropaKey => {
                        const items = groupedDigestoresData[tropaKey];
                        return (
                            <div
                                key={tropaKey}
                                style={{
                                    cursor: 'pointer',
                                    color: 'blue',
                                    border: '1px solid #ddd',
                                    padding: '5px',
                                    marginBottom: '5px'
                                }}
                                onClick={() => openModal(tropaKey, items)}
                            >
                                Tropa {tropaKey}
                            </div>
                        );
                    })}
                </div>
            </CustomModal>
            
            <CustomModal
                isOpen={mediasConsumoModal}
                onRequestClose={closeMediasConsumoModal}
                title="Medias Consumo"
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.keys(groupedMediasConsumoData).map(tropaKey => {
                        const items = groupedMediasConsumoData[tropaKey];
                        return (
                            <div
                                key={tropaKey}
                                style={{
                                    cursor: 'pointer',
                                    color: 'blue',
                                    border: '1px solid #ddd',
                                    padding: '5px',
                                    marginBottom: '5px'
                                }}
                                onClick={() => openModal(tropaKey, items)}
                            >
                                Tropa {tropaKey}
                            </div>
                        );
                    })}
                </div>
            </CustomModal>


            {selectedTropa && (
                <CustomModal
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    title={`Detalles de Tropa ${selectedTropa.tropa}`}
                >
                    <p><strong>Fecha de Faena:</strong> {formatFechaFaena(selectedTropa.items[0]["Fecha de faena"])}</p>
                    <p><strong>Destino Comercial:</strong> {selectedTropa.items[0]["Destino comercial"]}</p>
                    <p><strong>Vendedor:</strong> {selectedTropa.items[0].Vendedor}</p>
                    <p><strong>Consignatario:</strong> {selectedTropa.items[0].Consignatario}</p>
                    <p><strong>Total de Unidades:</strong> {unidadesTotales}</p>
                    <Button onClick={openDetailModal}>Ver Detalles de Medias</Button>
                </CustomModal>
            )}

            {selectedTropa && (
                <CustomModal
                    isOpen={detailModalIsOpen}
                    onRequestClose={closeDetailModal}
                    title={`Medias de Tropa ${selectedTropa.tropa}`}
                >
                    <ul>
                        {selectedTropa.items.map((item, index) => (
                            <li key={index}>
                                Correlativo: {item.Correlativo}, Lado: {item.Lado}, Tipificación: {item.Tipificación}
                            </li>
                        ))}
                    </ul>
                </CustomModal>
            )}
        </div>
    );
};

export default StockEnCamaras;
