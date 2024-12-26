import { React, useEffect, useState, } from 'react';
import { CircularProgress, Box } from '@mui/material';
import StockEnCamaras from './StockEnCamaras';
import axios from 'axios';
import { api } from '../config';


const StockCamarasPanel = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStockData();
    }, []);

    const fetchStockData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${api}/stock`);
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>
            <StockEnCamaras data={stockData} />
        </div>
    );
};

export default StockCamarasPanel;
