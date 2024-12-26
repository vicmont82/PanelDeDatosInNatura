import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, 'dd-MM-yyyy');
};

export const convertToDate = (dateNumber) => {
    const str = dateNumber.toString();
    if (str.length !== 8) return 'Invalid Date';
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    return `${day}-${month}-${year}`;
};

export const formatData = (data) => {
    return data.map((item) => ({
        ...item,
        correlativo: Number(item.Correlativo),
        Tropa: Number(item["Tropa"]),
        formattedHora: item["Hora"],
        "Fecha de faena": convertToDate(item["Fecha de faena"]),
        "Peso de palco": Number(item["Peso de palco"]).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        "Peso Tropa": Number(item["Peso Tropa"]).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        "Peso de oreo": Number(item["Peso de oreo"]).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        "Merma de oreo": `${Number(item["Merma de oreo"]).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
        "Fecha de producción": formatDate(item["Fecha de producción"]),
        "Horas de oreo": `${Number(item["Horas de oreo"]).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Hs.`
    }));
};
