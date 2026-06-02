import Papa from 'papaparse';

/**
 * Exports data to a CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Parses a CSV file into an array of objects
 * @param file The File object (from input[type="file"])
 * @returns Promise resolving to an array of objects
 */
export const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors && results.errors.length > 0) {
                    console.warn('CSV Parse Warnings:', results.errors);
                }
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
