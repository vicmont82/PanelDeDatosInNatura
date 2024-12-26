export const formatRito = (value) => {
    if (value === '0' || value === 0) return 'Convencional';
    if (value === '1' || value === 1) return 'Kosher';
    if (value === '3' || value === 3) return 'Rechazo Kosher';
    return 'Desconocido';
};

export const formatTipoVacuno = (value) => {
    switch (value) {
        case "1":
            return 'NT';
        case "2":
            return 'VA';
        case "3":
            return 'VQ';
        case "4":
            return 'TH';
        case "5":
            return 'TM';
        case "6":
            return 'TO';
        case "7":
            return 'MM';
        case "8":
            return 'NO';
        case "9":
            return 'MEJ';
        default:
            return value;
    }
};

export const formatData = (item) => {
    return {
        Hora: item['Hora'] || item['rohpro'],
        Tropa: Number(item['Tropa'] || item['rotrop']),
        Secuencia: Number(item['Secuencia'] || item['rosecu']),
        Correlativo: Number(item['Correlativo'] || item['rocorr']),
        Lado: item['Lado'] || item['rolado'],
        Peso:
            item['Peso'] || item['ropeso']
                ? Number(item['Peso'] || item['ropeso']).toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                })
                : '0.00',
        TipoVacuno: formatTipoVacuno(item['Tipo'] || item['rotvac']),
        Destino: item['Destino'] || item['rodest'],
        Tipificación: item['Tipificación'] || item['rocpal'],
        Conformación: item['Conformación'] || item['rogcal'],
        Cantidad: item['Cantidad'] || item['rogeng'],
        Raza: item['Raza'] || item['roraza'],
        Rito: formatRito(item['Rito'] || item['rorito']),
    };
};
