export const formatDate = (date: Date) => date.toISOString();

export const formatAppDate = (dateInput: any): string => {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        
        const format = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD-MM-YYYY':
                return `${day}-${month}-${year}`;
            case 'DD MMM YYYY':
                return `${day} ${monthsShort[date.getMonth()]} ${year}`;
            case 'DD MMMM YYYY':
                return `${day} ${monthsFull[date.getMonth()]} ${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    } catch (e) {
        return '-';
    }
};
