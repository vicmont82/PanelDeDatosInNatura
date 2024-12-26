const express = require('express');
const router = express.Router();
const { getRomaneosByFecha, 
        getIngresoDespostada, 
        getProduccionCajas, 
        getStockCamaras, 
        getListaDeMatanza, 
        getDatosHacienda,
        subscribeInsert,
        subscribeUpdate,
        getInterfazIniting,
        getLlenadoCamaras,
        updateRomaneos,
        getRomaneosAgregados,
        getIngresoDespostadaTop10Percent,
        getVendedores } = require('../controllers/romaneosController');

router.get('/romaneos', getRomaneosByFecha);
router.get('/despostada', getIngresoDespostada);
router.get('/cajas', getProduccionCajas);
router.get('/stock', getStockCamaras);
router.get('/listamatanza', getListaDeMatanza);
router.get('/datosHacienda', getDatosHacienda);
router.get('/interfazInting', getInterfazIniting);
router.get('/hacienda', getDatosHacienda);
router.get('/vendedores', getVendedores);
router.get('/realtime/insert', subscribeInsert);
router.get('/realtime/update', subscribeUpdate);
router.get('/llenadoCamaras', getLlenadoCamaras);
router.patch('/registrarOreo', updateRomaneos);
router.get('/camarasRito', getRomaneosAgregados);
router.get('/mermaTopTen', getIngresoDespostadaTop10Percent)

module.exports = router;
