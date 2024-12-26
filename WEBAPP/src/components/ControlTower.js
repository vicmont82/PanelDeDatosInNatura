// ControlTower.jsx
import React from 'react';
import { Box, Grid } from '@mui/material';
import RealTimeView from './RealTimeView';
import StatisticsCard from './StatisticsCard';
import Ciclo1RealTimePanel from './Ciclo1RealTimePanel';

const ControlTower = () => {
    return (
        <Box p={2}>
            <Grid container spacing={1}>
                <Grid item xs={12} style={{ height: 450, width: '100%' }}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <StatisticsCard index={0} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <RealTimeView />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <StatisticsCard index={2} />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Ciclo1RealTimePanel />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ControlTower;
