const { Pool } = require('pg');
const EventEmitter = require('events');


const pool = new Pool({
  user: 'postgres',
  host: '10.1.2.252',
  database: 'sjsv',
  password: 'postgres',
  port: 5432,
});

const poolvm = new Pool({
  user: 'postgres',
  host: '10.1.142.251',
  database: 'vmsv',
  password: 'postgres',
  port: 5432,
})

const realtimeEvents = new EventEmitter();

pool.connect((err, client) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    return;
  }

  // Suscribirse a los canales de notificaciones
  client.query('LISTEN romaneos_insert_channel');
  client.query('LISTEN romaneos_update_channel');

  // Escuchar notificaciones de PostgreSQL
  client.on('notification', (msg) => {
    const data = JSON.parse(msg.payload);
    if (msg.channel === 'romaneos_insert_channel') {
      realtimeEvents.emit('romaneos_insert', data);
    } else if (msg.channel === 'romaneos_update_channel') {
      realtimeEvents.emit('romaneos_update', data);
    }
  });
});

const subscribeInsert = (req, res) => {
  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  realtimeEvents.on('romaneos_insert', listener);

  req.on('close', () => {
    realtimeEvents.off('romaneos_insert', listener);
  });
};

const subscribeUpdate = (req, res) => {
  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  realtimeEvents.on('romaneos_update', listener);

  req.on('close', () => {
    realtimeEvents.off('romaneos_update', listener);
  });
};

const getRomaneosByFecha = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }
  const query = `
  SELECT
        r.roffae AS "Fecha",
        r.rotrop AS "Tropa",
        r.rocorr AS "Correlativo",
        r.rosecu AS "Secuencia",
        r.rolado AS "Lado",
        r.ropeso AS "Peso",
        r.rosecu AS "Secuencia",
        r.rocpal AS "Tipificación",
        r.rodest AS "Destino",
        r.rocam AS "Camara",
        r.roraza AS "Raza",
        r.rohpro AS "Hora",
        r.rogcal AS "Conformación",
        r.rogeng AS "Cantidad",
        r.rorito AS "Rito",
        COALESCE(tv.tvdesa, r.rotvac) AS "Tipo",
        a.amparo AS "Amparo",
        a.amparo_dos AS "Amparo Dos"
    FROM
        beeftran.romaneos r
    LEFT JOIN
        beefpar.tipovac tv
    ON
        r.rotvac = tv.tvcodi
        AND tv.tvesp = 'B'
    LEFT JOIN
        externo.amparos a
    ON
        r.rodest = a.tipificacion
    WHERE
        r.roffae = $1
    ORDER BY
        r.rocorr DESC;
    `;
  try {
    const { rows } = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

const getListaDeMatanza = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }

  const query = `
    SELECT DISTINCT ON (ic.cocord::integer)
        ic.cocord::integer AS Orden,
        ic.cotrop::integer AS Tropa,
        ic.cocorh::integer AS Cabezas,
        TO_CHAR(TO_DATE(ic.coffae::text, 'YYYYMMDD'), 'DD-MM-YYYY') AS Fecha,
        i.iin_vendedor AS Vendedor,
        i.iin_consig AS Consignatario,
        i.iin_guiapdo AS Localidad,
        i.iin_pesot AS Peso,
        i.iin_corral AS Corral,
        tv.tvdesc AS Tipo,
        c.cocord AS Inicia,
        c.cocorh AS Finaliza
    FROM
        interfaz.intcorr ic
    JOIN
        interfaz.inting i
        ON ic.cotrop = i.iin_tropa AND ic.coffae = $1
    LEFT JOIN (
        SELECT DISTINCT ON (tvcodi)
            tvcodi,
            tvdesc
        FROM
            beefpar.tipovac
        WHERE
            tvesp = 'B'
        ORDER BY
            tvcodi, tvdesc
    ) tv
        ON ic.cotvac = tv.tvcodi
    LEFT JOIN beeftran.correlat c
        ON ic.coffae = c.coffae
        AND ic.cotrop = c.cotrop
    ORDER BY
        ic.cocord::integer ASC;
  `;

  try {
    const { rows } = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al consultar la base de datos');
  }
}

const getIngresoDespostada = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }
  const query = `
      SELECT
        ro.roffae AS "Fecha de faena",
        ro.ropeso AS "Peso de palco",
        ro.rocpal AS "Tipificación",
        ro.rotrop AS "Tropa",
        ro.rocorr AS "Correlativo",
        ro.rolado AS "Lado",
        ro.rocam AS "Cámara",
        ro.rodest AS "Destino comercial",
        ro.rodiente AS "Dientes",
        ro.ropesoo AS "Peso de oreo",
        ro.rofechac AS "Fecha de producción",
        ro.rorito as "Rito",
      CASE
        WHEN ro.ropeso != 0 THEN ((ro.ropeso - ro.ropesoo) / ro.ropeso) * 100
        ELSE 0
      END AS "Merma de oreo",
        i.iin_cantcab AS "Cabezas",
        i.iin_pesot AS "Peso Tropa",
      EXTRACT(EPOCH FROM (ro.rofechac::timestamp - TO_TIMESTAMP(ro.roffae::text, 'YYYYMMDD'))) / 3600 AS "Horas de oreo",
        ro.rohorac AS "Hora de Ingreso"
      FROM beeftran.romaneos ro
      LEFT JOIN interfaz.inting i ON ro.rotrop = i.iin_tropa
        AND ro.roffae::text = replace(i.iin_fdia::text, '-', '')
      WHERE ro.rofechac::text = $1
      ORDER BY ro.rohorac DESC;
    `
  try {
    const { rows } = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al consultar la base de datos');
  }
}

const getProduccionCajas = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }
  const query = `
    SELECT
        deticaja.de_caja AS "nro de caja",
        deticaja.de_fec AS "Fecha de producción",
        deticaja.de_hora AS "Hora de producción",
        deticaja.de_produ AS "Codigo de producto",
        productos.pro_dorig AS "Producto",
        deticaja.de_bruto AS "Peso bruto",
        deticaja.de_neto AS "Peso Neto",
        deticaja.de_ffae AS "Fecha faena",
        deticaja.de_tropa AS "Tropa",
        deticaja.de_lote AS "Lote"
    FROM
        beeftran.deticaja
    JOIN
        beeftran.productos ON deticaja.de_produ = productos.pro_codint
    WHERE
        deticaja.de_fec = $1
    ORDER BY deticaja.de_hora DESC;
  `;
  try {
    const { rows } = await pool.query(query, [fecha]);
    const formattedRows = rows.map(row => {
      const date = new Date(row["Fecha de produccion"]);
      row["Fecha de produccion"] = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      row["Peso Neto"] = parseFloat(row["Peso Neto"]).toFixed(2);

      return row;
    });

    res.json(formattedRows);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al consultar la base de datos');
  }
}

const getStockCamaras = async (req, res) => {
  const query = `
      WITH romaneos_data AS (
        SELECT
            ro.roffae AS "Fecha de faena",
            ro.rotrop AS "Tropa",
            ro.rocpal AS "Tipificación",
            ro.rocorr AS "Correlativo",
            ro.rolado AS "Lado",
            ro.rocam AS "Cámara",
            ro.rodest AS "Destino comercial",
            ro.rodiente AS "Dientes",
            ro.rorito AS "Rito",
            ro.ropeso AS "Peso",
            i.iin_vendedor AS "Vendedor",
            i.iin_consig AS "Consignatario",
            i.iin_cantcab AS "Cabezas"
        FROM
            beeftran.romaneos ro
        LEFT JOIN
            interfaz.inting i
            ON ro.rotrop = i.iin_tropa
            AND ro.roffae = TO_NUMBER(TO_CHAR(i.iin_fdia, 'YYYYMMDD'), '99999999')
        WHERE
            ro.roffae BETWEEN TO_NUMBER(TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYYMMDD'), '99999999')
                          AND TO_NUMBER(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), '99999999')
            AND ro.rofechac IS NULL
            AND NOT (
                ro.rodest = 'ZZ'
                AND ro.roffae < TO_NUMBER(TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYYMMDD'), '99999999')
            )
        ),
        unique_dcamara_data AS (
            SELECT DISTINCT ON (dca.dca_tropa, dca.dca_fecha)
                dca.dca_tropa AS "Tropa",
                TO_NUMBER(TO_CHAR(dca.dca_fecha, 'YYYYMMDD'), '99999999') AS "Fecha de faena",
                dca.dca_cod AS "Cámara"
            FROM
                beeftran.dcamara dca
            WHERE
                dca.dca_fecha BETWEEN CURRENT_DATE - INTERVAL '4 days' AND CURRENT_DATE
        ),
        troops_with_exit AS (
            SELECT DISTINCT
                rotrop AS "Tropa"
            FROM
                beeftran.romaneos
            WHERE
                rofechac IS NOT NULL
                AND roffae BETWEEN TO_NUMBER(TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYYMMDD'), '99999999')
                              AND TO_NUMBER(TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), '99999999')
        )
        SELECT DISTINCT
            rd."Fecha de faena",
            rd."Tropa",
            rd."Tipificación",
            rd."Correlativo",
            rd."Lado",
            COALESCE(rd."Cámara", ud."Cámara") AS "Cámara",
            rd."Destino comercial",
            rd."Dientes",
            rd."Peso",
            rd."Vendedor",
            rd."Consignatario",
            rd."Cabezas"
        FROM
            romaneos_data rd
        LEFT JOIN
            unique_dcamara_data ud
            ON rd."Tropa" = ud."Tropa"
            AND rd."Fecha de faena" = ud."Fecha de faena"
        LEFT JOIN
            troops_with_exit te
            ON rd."Tropa" = te."Tropa"
        WHERE
            te."Tropa" IS NULL
        ORDER BY
            rd."Fecha de faena" DESC, rd."Tropa", rd."Correlativo", rd."Lado";
  `;
  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).send('Server error');
  }
};

const getDatosHacienda = async (req, res) => {
  const { start_date, end_date, planta, vendedor } = req.query;

  // Validar parámetros
  if (!start_date || !end_date || !planta) {
    return res.status(400).json({ error: 'Se requieren start_date, end_date, planta' });
  }

  // Validar que la planta sea válida
  const plantaValida = ['San Jorge', 'Villa Mercedes'].includes(planta);
  if (!plantaValida) {
    return res.status(400).json({ error: 'Planta inválida. Debe ser "San Jorge" o "Villa Mercedes"' });
  }

  try {
    let selectpool;
    let query;
    let params;

    if (planta === 'San Jorge') {
      selectpool = pool;
      query = `
        SELECT
            CAST(r.rocorr AS INTEGER) AS "Correlativo",
            TO_CHAR(TO_DATE(r.roffae::text, 'YYYYMMDD'), 'DD-MM-YYYY') AS "Fecha de Faena",
            r.ropeso AS "Peso de Palco",
            r.rocpal AS "Código de Palco",
            t.tvdesc AS "Tipo de Vacuno",
            CAST(r.rotrop AS INTEGER) AS "Tropa",
            r.rolado AS "Lado",
            r.rodest AS "Destino",
            r.rogcal AS "Calidad",
            SUBSTRING(r.rocpal FROM 2 FOR 1)::INTEGER AS "Grasa",
            i.iin_vendedor AS "Vendedor",
            i.iin_consig AS "Consignatario",
            i.iin_pesot AS "Peso Tropa",
            CAST(i.iin_cantcab AS INTEGER) AS "Cantidad de Cabezas",
            SUM(r.ropeso) OVER (PARTITION BY r.rotrop) AS "Peso Total por Tropa",
            SUM(CASE WHEN r.rodest = 'XD' THEN r.ropeso ELSE 0 END) OVER (PARTITION BY r.rotrop) AS "Peso Digestores"
        FROM
            beeftran.romaneos r
        JOIN
            beefpar.tipovac t ON r.rotvac = t.tvcodi AND t.tvesp = 'B'
        LEFT JOIN
            interfaz.inting i ON i.iin_tropa = r.rotrop
                              AND i.iin_fdia = TO_DATE(r.roffae::text, 'YYYYMMDD')
        WHERE
            TO_DATE(r.roffae::text, 'YYYYMMDD') BETWEEN TO_DATE($1, 'YYYY-MM-DD')
                                                  AND TO_DATE($2, 'YYYY-MM-DD')
            AND ($3::text IS NULL OR i.iin_vendedor = $3::text);

      `;
      // Si 'vendedor' no está definido o es una cadena vacía, establecerlo como null
      const vendedorParam = vendedor && vendedor.trim() !== '' ? vendedor : null;
      params = [start_date, end_date, vendedorParam];
    } else if (planta === 'Villa Mercedes') {
      selectpool = poolvm;
      query = `
        SELECT
            CAST(rocorr AS INTEGER) AS "Correlativo",
            TO_CHAR(TO_DATE(LPAD(roffae::text, 8, '0'), 'YYYYMMDD'), 'DD-MM-YYYY') AS "Fecha de Faena",
            ropeso AS "Peso de Palco",
            rocpal AS "Código de Palco",
            t.tvdesc AS "Tipo de Vacuno",
            CAST(rotrop AS INTEGER) AS "Tropa",
            rolado AS "Lado",
            rodest AS "Destino",
            rogcal AS "Calidad",
            SUBSTRING(r.rocpal FROM 2 FOR 1)::INTEGER AS "Grasa",
            SUM(r.ropeso) OVER (PARTITION BY r.rotrop) AS "Peso Total por Tropa",
            SUM(CASE WHEN r.rodest = 'XD' THEN r.ropeso ELSE 0 END) OVER (PARTITION BY r.rotrop) AS "Peso Digestores"
        FROM
            beeftran.romaneos r
        JOIN
            beefpar.tipovac t ON r.rotvac = t.tvcodi
                            AND t.tvesp = 'B'
        WHERE
            TO_DATE(LPAD(r.roffae::text, 8, '0'), 'YYYYMMDD') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD');

      `;
      params = [start_date, end_date];
    }

    // Ejecutar la consulta
    const result = await selectpool.query(query, params);

    // Devolver los resultados en formato JSON
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los romaneos:', error);
    res.status(500).json({ error: 'Error al obtener los romaneos' });
  }
};

const getVendedores = async (req, res) => {
  const query = `
     SELECT DISTINCT iin_vendedor AS vendedor
    FROM interfaz.inting
    WHERE iin_vendedor IS NOT NULL;
  `
  try {
    const { rows } = await pool.query(query)
    res.json(rows)
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Server error');
  }
}

const getLlenadoCamaras = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).send('Las fechas de inicio y fin son requeridas');
  }

  try {
    // Primera consulta: Amparos
    const queryAmparos = `
      SELECT
          txtcam.txc_cod AS "Camara",
          txtcam.txc_texto AS "Registro Manual",
          romaneos.rotrop AS "Tropa",
          TO_DATE(romaneos.roffae::text, 'YYYYMMDD') AS "Fecha",
          COALESCE(amparos.amparo_dos, 'Sin Amparo') AS "Nombre Amparo",
          COUNT(*) AS "Total Medias Amp",
          (COUNT(*) / 2) AS "Total Animales Amp"
      FROM
          beeftran.romaneos
          JOIN beeftran.txtcam ON romaneos.rotrop = txtcam.txc_tropa
              AND TO_DATE(romaneos.roffae::text, 'YYYYMMDD') = txtcam.txc_fecha
          LEFT JOIN externo.amparos amparos ON romaneos.rodest = amparos.tipificacion
      WHERE
          TO_DATE(romaneos.roffae::text, 'YYYYMMDD') BETWEEN $1 AND $2
      GROUP BY
          txtcam.txc_cod,
          romaneos.rotrop,
          "Fecha",
          "Registro Manual",
          "Nombre Amparo"
      ORDER BY
          txtcam.txc_cod,
          romaneos.rotrop,
          "Fecha",
          "Nombre Amparo";
    `;

    // Segunda consulta: Tipo de animales
    const queryTipos = `
      SELECT
          romaneos.rotrop AS "Tropa",
          TO_DATE(romaneos.roffae::text, 'YYYYMMDD') AS "Fecha",
          romaneos.rotvac AS "Tipovac Código",
          COALESCE(tipovac.tvdesa, 'Sin Descripción') AS "Tipovac Descripción",
          COUNT(*) AS "Total Medias Tipo",
          (COUNT(*) / 2) AS "Total Animales Tipo"
      FROM
          beeftran.romaneos
          LEFT JOIN beefpar.tipovac ON romaneos.rotvac = tipovac.tvcodi
      WHERE
          TO_DATE(romaneos.roffae::text, 'YYYYMMDD') BETWEEN $1 AND $2
      GROUP BY
          romaneos.rotrop,
          "Fecha",
          "Tipovac Código",
          "Tipovac Descripción"
      ORDER BY
          romaneos.rotrop,
          "Fecha",
          "Tipovac Código";
    `;

    // Ejecutar ambas consultas en paralelo
    const [amparosResult, tiposResult] = await Promise.all([
      pool.query(queryAmparos, [fecha_inicio, fecha_fin]),
      pool.query(queryTipos, [fecha_inicio, fecha_fin]),
    ]);

    // Procesar y combinar los resultados
    const amparosData = amparosResult.rows;
    const tiposData = tiposResult.rows;

    // Crear un objeto para agrupar los datos por tropa y fecha
    const dataMap = {};

    // Procesar datos de Amparos
    for (const row of amparosData) {
      const key = `${row.Tropa}_${row.Fecha}`;
      if (!dataMap[key]) {
        dataMap[key] = {
          Camara: row.Camara,
          Tropa: row.Tropa,
          Fecha: row.Fecha,
          Texto: row["Registro Manual"],
          Amparos: [],
          Tipos: [],
        };
      }
      dataMap[key].Amparos.push({
        NombreAmparo: row['Nombre Amparo'],
        TotalMediasAmp: row['Total Medias Amp'],
        TotalAnimalesAmp: row['Total Animales Amp'],
      });
    }

    // Procesar datos de Tipos
    for (const row of tiposData) {
      const key = `${row.Tropa}_${row.Fecha}`;
      if (!dataMap[key]) {
        dataMap[key] = {
          Camara: null, // No tenemos la cámara en esta consulta
          Tropa: row.Tropa,
          Fecha: row.Fecha,
          Amparos: [],
          Tipos: [],
        };
      }
      dataMap[key].Tipos.push({
        TipovacCodigo: row['Tipovac Código'],
        TipovacDescripcion: row['Tipovac Descripción'],
        TotalMediasTipo: row['Total Medias Tipo'],
        TotalAnimalesTipo: row['Total Animales Tipo'],
      });
    }

    // Convertir el mapa en un array para la respuesta
    const resultData = Object.values(dataMap);

    res.json(resultData);
  } catch (error) {
    console.error('Error al ejecutar las consultas:', error);
    res.status(500).send('Error al obtener los datos');
  }
};

const getInterfazIniting = async (req, res) => {
  const fecha = req.query.fecha;
  const tropa = req.query.tropa;
  const query = `
        SELECT
            iin_cantcab
        FROM
            interfaz.inting
        WHERE
            iin_fdia = $1
            AND iin_tropa = $2
        LIMIT 1
    `;
  try {
    const { rows } = await pool.query(query, [fecha, tropa]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).send('Server error');
  }
}

const updateRomaneos = async (req, res) => {
  const { roffae, rotrop, rofechac, rohorac } = req.body;

  // Validar que todos los parámetros necesarios estén presentes
  if (!roffae || !rotrop || !rofechac || !rohorac) {
    return res.status(400).json({ error: 'Se requieren los campos roffae, rotrop, rofechac y rohorac' });
  }

  // Opcional: Validar formatos de los campos
  const roffaeNum = Number(roffae);
  const rotropNum = Number(rotrop);
  const rofechacDate = new Date(rofechac);
  const rohoracTime = rohorac; // Se asume que el formato es 'HH:MM:SS'

  if (isNaN(roffaeNum) || isNaN(rotropNum) || isNaN(rofechacDate.getTime())) {
    return res.status(400).json({ error: 'Formato de datos inválido' });
  }

  // Consulta SQL para actualizar los registros
  const query = `
    UPDATE beeftran.romaneos
    SET 
      rofechac = $1,
      rohorac = $2,
      ropesoo = ROUND(ropeso * 0.985, 1)
    WHERE 
      roffae = $3
      AND rotrop = $4
      AND rodest = 'ZZ'
    RETURNING *;
  `;

  try {
    const { rows } = await pool.query(query, [rofechac, rohorac, roffaeNum, rotropNum]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron registros que cumplan con los criterios especificados' });
    }

    res.json({ message: 'Registros actualizados exitosamente', data: rows });
  } catch (error) {
    console.error('Error actualizando romaneos:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar los registros' });
  }
};

const getRomaneosAgregados = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }

  const query = `
    SELECT
        r.rocam AS "Camara",
        r.rotrop AS "Tropa",
        r.rorito AS "Rito",
        a.amparo_dos AS "Amparo_Dos",
        COUNT(*) AS "Count"
    FROM
        beeftran.romaneos r
    LEFT JOIN
        beefpar.tipovac tv
        ON r.rotvac = tv.tvcodi
        AND tv.tvesp = 'B'
    LEFT JOIN
        externo.amparos a
        ON r.rodest = a.tipificacion
    WHERE
        r.roffae = $1
    GROUP BY
        r.rocam, r.rotrop, r.rorito, a.amparo_dos
    ORDER BY
        r.rocam, r.rotrop, r.rorito, a.amparo_dos;
  `;

  try {
    const { rows } = await pool.query(query, [fecha]);

    const resultado = [];

    const camarasMap = {};

    for (const row of rows) {
      const { Camara, Tropa, Rito, Amparo_Dos, Count } = row;

      if (!camarasMap[Camara]) {
        camarasMap[Camara] = {
          Camara,
          Tropas: {}
        };
      }

      if (!camarasMap[Camara].Tropas[Tropa]) {
        camarasMap[Camara].Tropas[Tropa] = {
          Tropa,
          Ritos: {}
        };
      }

      if (!camarasMap[Camara].Tropas[Tropa].Ritos[Rito]) {
        camarasMap[Camara].Tropas[Tropa].Ritos[Rito] = {
          Rito,
          Total: 0,
          PorAmparoDos: {}
        };
      }

      camarasMap[Camara].Tropas[Tropa].Ritos[Rito].Total += parseInt(Count, 10);

      const amparoClave = Amparo_Dos || 'SIN_AMPARO_DOS';
      if (!camarasMap[Camara].Tropas[Tropa].Ritos[Rito].PorAmparoDos[amparoClave]) {
        camarasMap[Camara].Tropas[Tropa].Ritos[Rito].PorAmparoDos[amparoClave] = 0;
      }

      camarasMap[Camara].Tropas[Tropa].Ritos[Rito].PorAmparoDos[amparoClave] += parseInt(Count, 10);
    }

    for (const camaraKey in camarasMap) {
      const camaraData = camarasMap[camaraKey];
      const tropasArray = [];

      for (const tropaKey in camaraData.Tropas) {
        const tropaData = camaraData.Tropas[tropaKey];
        const ritosArray = [];

        for (const ritoKey in tropaData.Ritos) {
          const ritoData = tropaData.Ritos[ritoKey];
          const amparosArray = [];

          for (const amparoKey in ritoData.PorAmparoDos) {
            amparosArray.push({
              AmparoDos: amparoKey,
              Count: ritoData.PorAmparoDos[amparoKey]
            });
          }

          ritosArray.push({
            Rito: ritoData.Rito,
            Total: ritoData.Total,
            PorAmparoDos: amparosArray
          });
        }

        tropasArray.push({
          Tropa: tropaData.Tropa,
          Ritos: ritosArray
        });
      }

      resultado.push({
        Camara: camaraData.Camara,
        Tropas: tropasArray
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

const getIngresoDespostadaTop10Percent = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).send('La fecha es requerida');
  }

  const query = `
    WITH cte AS (
      SELECT
        ro.roffae AS "Fecha de faena",
        ro.ropeso AS "Peso de palco",
        ro.rocpal AS "Tipificación",
        ro.rotrop AS "Tropa",
        ro.rocorr AS "Correlativo",
        ro.rolado AS "Lado",
        ro.rocam AS "Cámara",
        ro.rodest AS "Destino comercial",
        ro.rodiente AS "Dientes",
        ro.ropesoo AS "Peso de oreo",
        ro.rofechac AS "Fecha de producción",
        ro.rorito as "Rito",
        CASE
          WHEN ro.ropeso != 0 THEN ((ro.ropeso - ro.ropesoo) / ro.ropeso) * 100
          ELSE 0
        END AS "Merma de oreo",
        i.iin_cantcab AS "Cabezas",
        i.iin_pesot AS "Peso Tropa",
        EXTRACT(EPOCH FROM (ro.rofechac::timestamp - TO_TIMESTAMP(ro.roffae::text, 'YYYYMMDD'))) / 3600 AS "Horas de oreo",
        ro.rohorac AS "Hora de Ingreso",
        ROW_NUMBER() OVER (PARTITION BY ro.rocam ORDER BY ro.rohorac) AS rn,
        COUNT(*) OVER (PARTITION BY ro.rocam) AS total_per_cam
      FROM beeftran.romaneos ro
      LEFT JOIN interfaz.inting i ON ro.rotrop = i.iin_tropa
        AND ro.roffae::text = replace(i.iin_fdia::text, '-', '')
      WHERE ro.rofechac::text = $1
    )
    SELECT *
    FROM cte
    WHERE rn <= total_per_cam * 0.1
    ORDER BY "Hora de Ingreso" DESC;
  `;

  try {
    const { rows } = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al consultar la base de datos');
  }
}



module.exports = {
  getRomaneosByFecha,
  getIngresoDespostada, 
  getProduccionCajas,
  getStockCamaras,
  getListaDeMatanza,
  getDatosHacienda,
  getInterfazIniting,
  getVendedores,
  subscribeInsert,
  subscribeUpdate,
  getLlenadoCamaras,
  updateRomaneos,
  getRomaneosAgregados,
  getIngresoDespostadaTop10Percent
};
