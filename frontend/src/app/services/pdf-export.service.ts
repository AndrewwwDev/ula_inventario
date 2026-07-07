import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_ASSETS } from './pdf-assets';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  generarReporte(titulo: string, columnas: string[], data: any[][], periodoFormateado?: string) {
    const doc = new jsPDF('landscape');
    
    // Variable para paginación dinámica (X de Y)
    const totalPagesExp = '{total_pages_count_string}';
    
    let startY = 45; // Inicio de tabla para no pisar el encabezado

    // Renderizamos el periodo formatado si existe (solo en la primera página por encima de la tabla)
    if (periodoFormateado) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(periodoFormateado, 14, startY - 4);
    }

    // Tabla con autoTable
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102], // Azul corporativo
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      // MÁRGENES DE PROTECCIÓN: OBLIGATORIOS para evitar que la tabla pise el header y el footer
      margin: { top: 40, right: 14, bottom: 35, left: 14 },
      
      // Hook didDrawPage para dibujar el Header y el Footer en TODAS las páginas generadas
      didDrawPage: (hookData) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

        // ---- ENCABEZADO (HEADER) ----
        // Proporciones institucionales corregidas (Logo a la izquierda, sin estirar)
        const headerWidth = 60; 
        const headerHeight = 18; 
        const headerX = 14; // Alineado al margen izquierdo
        const headerY = 10;
        
        // Inyectamos la imagen base64
        doc.addImage(PDF_ASSETS.HEADER_LOGO, 'JPEG', headerX, headerY, headerWidth, headerHeight);

        // Título del reporte (Se pinta debajo del logo en cada hoja)
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, 14, headerY + headerHeight + 8);

        // ---- PIE DE PÁGINA (FOOTER) ----
        const footerWidth = 260; 
        const footerHeight = 20; 
        const footerX = (pageWidth - footerWidth) / 2;
        const footerY = pageHeight - footerHeight - 5;
        
        // Inyectamos la imagen base64
        doc.addImage(PDF_ASSETS.FOOTER_LOGO, 'JPEG', footerX, footerY, footerWidth, footerHeight);

        // Paginación (Página X de Y)
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.setFont('helvetica', 'normal');
        let pageString = 'Página ' + hookData.pageNumber;
        if (typeof doc.putTotalPages === 'function') {
          pageString = pageString + ' de ' + totalPagesExp;
        }
        // Posicionamos el número de página arriba a la derecha del footer
        doc.text(pageString, pageWidth - 14, footerY - 2, { align: 'right' });
      }
    });

    // Inyectar el total de páginas (para la variable totalPagesExp)
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }

    // Guardar el PDF generado
    doc.save(`${titulo.replace(/ /g, '_').toLowerCase()}_${new Date().getTime()}.pdf`);
  }
}
