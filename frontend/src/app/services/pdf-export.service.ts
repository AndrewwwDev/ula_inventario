import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  generarReporte(titulo: string, columnas: string[], data: any[][], periodoFormateado?: string) {
    const doc = new jsPDF('landscape');

    // Título Institucional
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102); // Azul corporativo
    const text1 = 'UNIVERSIDAD DE LOS ANDES';
    const textWidth1 = doc.getStringUnitWidth(text1) * doc.getFontSize() / doc.internal.scaleFactor;
    const textOffset1 = (doc.internal.pageSize.width - textWidth1) / 2;
    doc.text(text1, textOffset1, 20);

    doc.setFontSize(14);
    const text2 = 'SISTEMA DE INVENTARIO - REGISTRO DE BIENES';
    const textWidth2 = doc.getStringUnitWidth(text2) * doc.getFontSize() / doc.internal.scaleFactor;
    const textOffset2 = (doc.internal.pageSize.width - textWidth2) / 2;
    doc.text(text2, textOffset2, 28);

    // Título del Reporte
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, 14, 40);

    let startY = 46;

    // Periodo si existe
    if (periodoFormateado) {
      doc.setFontSize(10);
      doc.text(periodoFormateado, 14, startY);
      startY += 8;
    }

    // Tabla
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { top: 15, right: 14, bottom: 15, left: 14 }
    });

    // Guardar el documento
    doc.save(`${titulo.replace(/ /g, '_').toLowerCase()}_${new Date().getTime()}.pdf`);
  }
}
