import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, 'dd-MM-yyyy');
};

export const formatDateArray = (dateArray) => {
    if (!Array.isArray(dateArray)) return 'Invalid Date';
    return dateArray.map(dateString => formatDate(dateString));
};

export const formatData = (data) => {
    return data.map((item, index) => ({
        id: index,
        ...item,
        correlativo: Number(item["nro de caja"]),
        "Fecha de producción": formatDate(item["Fecha de producción"]),
        "Fecha faena": formatDateArray(item["Fecha faena"]),
        "Peso Neto": Number(item["Peso Neto"].toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),),
        "Peso bruto": Number(item["Peso bruto"].toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),)
    }));
};
