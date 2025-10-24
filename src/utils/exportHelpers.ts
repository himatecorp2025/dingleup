import { toast } from 'sonner';

export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  try {
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('CSV sikeresen exportálva!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Hiba az exportálás során');
  }
};

export const exportToExcel = async (data: any[], filename: string) => {
  toast.info('Excel export hamarosan elérhető!');
};
