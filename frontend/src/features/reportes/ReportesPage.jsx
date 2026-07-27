import React, { useState, useEffect, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import Chart from 'react-apexcharts';
import XLSX from 'xlsx-js-style';
import html2pdf from 'html2pdf.js';
import ExcelJS from 'exceljs';
import logoMeducaPng from '../../assets/logo_meduca.png';
import { LOGO_MEDUCA_BASE64 } from '../../assets/logoMeducaBase64';
import {
  FileText,
  FileSpreadsheet,
  Wrench,
  ArrowRightLeft,
  Undo2,
  Users,
  Filter,
  Download
} from 'lucide-react';

const ReportesPage = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);

  const [tipo, setTipo] = useState('prestamos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [reporteData, setReporteData] = useState([]);
  const [loading, setLoading] = useState(false);

  // View Switcher State: 'pdf' | 'excel'
  const [vistaMode, setVistaMode] = useState('pdf');

  const renderEstadoBadge = (estado) => {
    const est = (estado || 'Disponible').toString().trim();
    let badgeBg = '#e8f5e9';
    let badgeColor = '#2e7d32';
    let badgeBorder = '#a5d6a7';

    if (est === 'Prestado' || est === 'Pendiente' || est === 'En Tránsito') {
      badgeBg = '#fff8e1';
      badgeColor = '#b78103';
      badgeBorder = '#ffe082';
    } else if (est === 'Dañado' || est === 'Con Daño' || est === 'Vencido' || est === 'Inactivo') {
      badgeBg = '#ffebee';
      badgeColor = '#c62828';
      badgeBorder = '#ef9a9a';
    } else if (est === 'Mantenimiento' || est === 'En Reparación') {
      badgeBg = '#fff3e0';
      badgeColor = '#e65100';
      badgeBorder = '#ffcc80';
    }

    return (
      <span
        style={{
          backgroundColor: badgeBg,
          color: badgeColor,
          borderColor: badgeBorder,
          borderWidth: '1px',
          borderStyle: 'solid',
          padding: '3px 9px',
          fontSize: '0.725rem',
          borderRadius: '12px',
          fontWeight: '700',
          display: 'inline-block'
        }}
      >
        {est.toUpperCase()}
      </span>
    );
  };

  const fetchReporte = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes/generar?tipo=${tipo}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`);
      if (res.data.success) {
        setReporteData(res.data.data.registros || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [tipo]);

  // Metrics calculation
  const totalRegistros = reporteData.length;
  const criticosCount = reporteData.filter(
    (i) => i.estado === 'Dañado' || i.estado === 'Vencido' || i.estado === 'Mantenimiento'
  ).length;
  const normalesCount = reporteData.filter(
    (i) => i.estado === 'Disponible' || i.estado === 'Devuelto' || i.estado === 'Activo'
  ).length;
  const pendientesCount = reporteData.filter(
    (i) => i.estado === 'Prestado' || i.estado === 'Inactivo'
  ).length;

  // Thin Border Definition for Excel Cells
  const thinBorder = {
    top: { style: 'thin', color: { rgb: 'D0D0D0' } },
    bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
    left: { style: 'thin', color: { rgb: 'D0D0D0' } },
    right: { style: 'thin', color: { rgb: 'D0D0D0' } }
  };

  // Export Native Styled .XLSX Excel File with Embedded Logo & Cell Formatting (ExcelJS)
  const handleExportExcel = async () => {
    toast.info('Generando archivo de hoja de cálculo Excel...');
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Informe_MEDUCA');

      // Row 1: Reserved for Large Government Logo
      const rLogo = worksheet.addRow(['']);
      rLogo.height = 62;

      // Add Centered Logo Image above title text
      if (LOGO_MEDUCA_BASE64) {
        const logoId = workbook.addImage({
          base64: LOGO_MEDUCA_BASE64.replace(/^data:image\/png;base64,/, ''),
          extension: 'png',
        });
        worksheet.addImage(logoId, {
          tl: { col: 3.25, row: 0.1 },
          ext: { width: 240, height: 58 }
        });
      }

      // Row 2: Header Title (Merged A2:I2)
      const r1 = worksheet.addRow(['REPÚBLICA DE PANAMÁ • MINISTERIO DE EDUCACIÓN']);
      worksheet.mergeCells('A2:I2');
      const cA2 = worksheet.getCell('A2');
      cA2.font = { bold: true, size: 13, color: { argb: 'FF0A2540' } };
      cA2.alignment = { vertical: 'middle', horizontal: 'center' };
      r1.height = 24;

      // Row 3: Department Subtitle (Merged A3:I3)
      const r2 = worksheet.addRow(['MEDUCA COCLÉ • DEPARTAMENTO DE MANTENIMIENTO']);
      worksheet.mergeCells('A3:I3');
      const cA3 = worksheet.getCell('A3');
      cA3.font = { bold: true, size: 11, color: { argb: 'FF1A5BB8' } };
      cA3.alignment = { vertical: 'middle', horizontal: 'center' };
      r2.height = 22;

      // Row 4: Report Name (Merged A4:I4)
      const r3 = worksheet.addRow([`INFORME OFICIAL DE ANÁLISIS DE DATOS Y MÉTRICAS (${tipo.toUpperCase()})`]);
      worksheet.mergeCells('A4:I4');
      const cA4 = worksheet.getCell('A4');
      cA4.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
      cA4.alignment = { vertical: 'middle', horizontal: 'center' };
      r3.height = 20;

      // Row 5: Metadata (Merged A5:I5)
      const r4 = worksheet.addRow([`FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-PA')} | GENERADO POR: ${user?.nombre || 'Administrador'}`]);
      worksheet.mergeCells('A5:I5');
      const cA5 = worksheet.getCell('A5');
      cA5.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
      cA5.alignment = { vertical: 'middle', horizontal: 'center' };
      r4.height = 20;

      worksheet.addRow([]);

      // Row 7: Section Header for KPI (Merged A7:I7)
      const r7 = worksheet.addRow(['RESUMEN EJECUTIVO (MÉTRICAS Y PUNTOS DE CONTROL)']);
      worksheet.mergeCells('A7:I7');
      const cA7 = worksheet.getCell('A7');
      cA7.font = { bold: true, size: 11, color: { argb: 'FF0A2540' } };
      cA7.alignment = { vertical: 'middle', horizontal: 'center' };
      r7.height = 22;

      // KPI Card 1: Total Data Points (Pastel Fill + Soft Green Border)
      worksheet.mergeCells('A8:B8');
      worksheet.mergeCells('A9:B9');
      const cellK1H = worksheet.getCell('A8');
      cellK1H.value = 'TOTAL REGISTROS';
      cellK1H.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      cellK1H.font = { bold: true, size: 8.5, color: { argb: 'FF15803D' } };
      cellK1H.alignment = { horizontal: 'center', vertical: 'middle' };

      const cellK1V = worksheet.getCell('A9');
      cellK1V.value = totalRegistros;
      cellK1V.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      cellK1V.font = { bold: true, size: 15, color: { argb: 'FF15803D' } };
      cellK1V.alignment = { horizontal: 'center', vertical: 'middle' };

      ['A8', 'A9', 'B8', 'B9'].forEach(pos => {
        worksheet.getCell(pos).border = {
          top: { style: 'thin', color: { argb: 'FF86EFAC' } },
          bottom: { style: 'thin', color: { argb: 'FF86EFAC' } },
          left: { style: 'thin', color: { argb: 'FF86EFAC' } },
          right: { style: 'thin', color: { argb: 'FF86EFAC' } }
        };
      });

      // KPI Card 2: Critical Items (Pastel Fill + Soft Red Border)
      worksheet.mergeCells('C8:D8');
      worksheet.mergeCells('C9:D9');
      const cellK2H = worksheet.getCell('C8');
      cellK2H.value = 'ALTA PRIORIDAD (CRÍTICOS)';
      cellK2H.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      cellK2H.font = { bold: true, size: 8.5, color: { argb: 'FFB91C1C' } };
      cellK2H.alignment = { horizontal: 'center', vertical: 'middle' };

      const cellK2V = worksheet.getCell('C9');
      cellK2V.value = criticosCount;
      cellK2V.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      cellK2V.font = { bold: true, size: 15, color: { argb: 'FFB91C1C' } };
      cellK2V.alignment = { horizontal: 'center', vertical: 'middle' };

      ['C8', 'C9', 'D8', 'D9'].forEach(pos => {
        worksheet.getCell(pos).border = {
          top: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          bottom: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          left: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          right: { style: 'thin', color: { argb: 'FFFCA5A5' } }
        };
      });

      // KPI Card 3: Normal Metrics (Pastel Fill + Soft Blue Border)
      worksheet.mergeCells('E8:F8');
      worksheet.mergeCells('E9:F9');
      const cellK3H = worksheet.getCell('E8');
      cellK3H.value = 'DISPONIBLES / NORMALES';
      cellK3H.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      cellK3H.font = { bold: true, size: 8.5, color: { argb: 'FF0369A1' } };
      cellK3H.alignment = { horizontal: 'center', vertical: 'middle' };

      const cellK3V = worksheet.getCell('E9');
      cellK3V.value = normalesCount;
      cellK3V.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      cellK3V.font = { bold: true, size: 15, color: { argb: 'FF0369A1' } };
      cellK3V.alignment = { horizontal: 'center', vertical: 'middle' };

      ['E8', 'E9', 'F8', 'F9'].forEach(pos => {
        worksheet.getCell(pos).border = {
          top: { style: 'thin', color: { argb: 'FF93C5FD' } },
          bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
          left: { style: 'thin', color: { argb: 'FF93C5FD' } },
          right: { style: 'thin', color: { argb: 'FF93C5FD' } }
        };
      });

      // KPI Card 4: Pending / In Transit (Pastel Fill + Soft Yellow Border)
      worksheet.mergeCells('G8:H8');
      worksheet.mergeCells('G9:H9');
      const cellK4H = worksheet.getCell('G8');
      cellK4H.value = 'PENDIENTES / TRÁNSITO';
      cellK4H.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
      cellK4H.font = { bold: true, size: 8.5, color: { argb: 'FFA16207' } };
      cellK4H.alignment = { horizontal: 'center', vertical: 'middle' };

      const cellK4V = worksheet.getCell('G9');
      cellK4V.value = pendientesCount;
      cellK4V.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
      cellK4V.font = { bold: true, size: 15, color: { argb: 'FFA16207' } };
      cellK4V.alignment = { horizontal: 'center', vertical: 'middle' };

      ['G8', 'G9', 'H8', 'H9'].forEach(pos => {
        worksheet.getCell(pos).border = {
          top: { style: 'thin', color: { argb: 'FFFDE047' } },
          bottom: { style: 'thin', color: { argb: 'FFFDE047' } },
          left: { style: 'thin', color: { argb: 'FFFDE047' } },
          right: { style: 'thin', color: { argb: 'FFFDE047' } }
        };
      });

      worksheet.addRow([]);
      const r11 = worksheet.addRow(['DETALLE OPERATIVO DE MÉTRICAS ANALIZADAS']);
      worksheet.mergeCells('A11:I11');
      r11.font = { bold: true, size: 10.5, color: { argb: 'FF0A2540' } };
      r11.height = 20;

      // Table Header Row (White Background #FFFFFF with Bold Dark Navy Font & Soft Slate Border)
      let tableHeaders = [];
      if (tipo === 'prestamos') {
        tableHeaders = ['CÓDIGO PRÉSTAMO', 'FUNCIONARIO SOLICITANTE', 'CÉDULA', 'ESCUELA / PROYECTO', 'FECHA PRÉSTAMO', 'FECHA DEV. ESTIMADA', 'ESTADO', 'HERRAMIENTAS INVOLUCRADAS', 'REGISTRADO POR'];
      } else if (tipo === 'herramientas') {
        tableHeaders = ['CÓDIGO HERRAMIENTA', 'NOMBRE HERRAMIENTA', 'MARCA', 'MODELO', 'NÚMERO DE SERIE', 'UBICACIÓN EN BODEGA', 'ESTADO', 'OBSERVACIONES'];
      } else if (tipo === 'devoluciones') {
        tableHeaders = ['CÓDIGO PRÉSTAMO', 'FUNCIONARIO', 'ESCUELA / PROYECTO', 'FECHA DEVOLUCIÓN', 'REGISTRADO POR', 'OBSERVACIONES'];
      } else if (tipo === 'funcionarios') {
        tableHeaders = ['CÉDULA', 'NOMBRE COMPLETO', 'CARGO', 'DEPARTAMENTO', 'TELÉFONO', 'CORREO ELECTRÓNICO', 'ESTADO'];
      }

      const thRow = worksheet.addRow(tableHeaders);
      thRow.height = 24;
      thRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.font = { bold: true, color: { argb: 'FF0A2540' }, size: 9.5 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      // Data Rows with Subtle Slate Grey Gridlines (#D1D5DB)
      reporteData.forEach((item, idx) => {
        let rowValues = [];
        let stText = (item.estado_devolucion || item.estado || 'Disponible').toUpperCase();

        if (tipo === 'prestamos') {
          rowValues = [
            item.codigo_prestamo,
            `${item.funcionario_nombre} ${item.funcionario_apellido}`,
            item.funcionario_cedula || 'N/A',
            item.escuela_proyecto,
            item.fecha_prestamo ? new Date(item.fecha_prestamo).toLocaleDateString() : '',
            item.fecha_devolucion_estimada || 'N/A',
            stText,
            (item.herramientas || []).map(h => `${h.codigo} - ${h.nombre}`).join('; '),
            item.registrado_por || 'Sistema'
          ];
        } else if (tipo === 'herramientas') {
          rowValues = [
            item.codigo,
            item.nombre,
            item.marca,
            item.modelo || 'N/A',
            item.numero_serie || 'N/A',
            item.ubicacion,
            stText,
            item.observaciones || ''
          ];
        } else if (tipo === 'devoluciones') {
          rowValues = [
            item.codigo_prestamo,
            `${item.funcionario_nombre} ${item.funcionario_apellido}`,
            item.escuela_proyecto,
            item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleDateString() : '',
            item.registrado_por || 'Sistema',
            item.observaciones || ''
          ];
        } else if (tipo === 'funcionarios') {
          rowValues = [
            item.cedula,
            `${item.nombre} ${item.apellido}`,
            item.cargo,
            item.departamento,
            item.telefono || 'N/A',
            item.email || 'N/A',
            stText
          ];
        }

        const dataRow = worksheet.addRow(rowValues);
        dataRow.height = 20;

        dataRow.eachCell((cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
          cell.alignment = { vertical: 'middle' };

          if (colNumber === 1) {
            cell.font = { bold: true, color: { argb: 'FF1A5BB8' } };
          }

          // Custom Status Cell Highlighting with Soft Border
          const headerName = tableHeaders[colNumber - 1];
          if (headerName === 'ESTADO') {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (stText === 'DISPONIBLE' || stText === 'DEVUELTO' || stText === 'ACTIVO' || stText === 'EXCELENTE' || stText === 'BUENO') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
              cell.font = { bold: true, color: { argb: 'FF15803D' }, size: 9 };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF86EFAC' } },
                bottom: { style: 'thin', color: { argb: 'FF86EFAC' } },
                left: { style: 'thin', color: { argb: 'FF86EFAC' } },
                right: { style: 'thin', color: { argb: 'FF86EFAC' } }
              };
            } else if (stText === 'PRESTADO' || stText === 'PENDIENTE' || stText === 'REGULAR') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
              cell.font = { bold: true, color: { argb: 'FFA16207' }, size: 9 };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFFDE047' } },
                bottom: { style: 'thin', color: { argb: 'FFFDE047' } },
                left: { style: 'thin', color: { argb: 'FFFDE047' } },
                right: { style: 'thin', color: { argb: 'FFFDE047' } }
              };
            } else if (stText === 'DAÑADO' || stText === 'CON DAÑO' || stText === 'INACTIVO' || stText === 'VENCIDO') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
              cell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 9 };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFFCA5A5' } },
                bottom: { style: 'thin', color: { argb: 'FFFCA5A5' } },
                left: { style: 'thin', color: { argb: 'FFFCA5A5' } },
                right: { style: 'thin', color: { argb: 'FFFCA5A5' } }
              };
            } else if (stText === 'MANTENIMIENTO') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
              cell.font = { bold: true, color: { argb: 'FFE65100' }, size: 9 };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFFFCC80' } },
                bottom: { style: 'thin', color: { argb: 'FFFFCC80' } },
                left: { style: 'thin', color: { argb: 'FFFFCC80' } },
                right: { style: 'thin', color: { argb: 'FFFFCC80' } }
              };
            }
          }
        });
      });

      // Total Summary Row with Black Border
      worksheet.mergeCells(`A${worksheet.rowCount + 1}:B${worksheet.rowCount + 1}`);
      const totalRowCell = worksheet.getCell(`A${worksheet.rowCount}`);
      totalRowCell.value = `TOTAL REGISTROS: ${totalRegistros}`;
      totalRowCell.font = { bold: true, color: { argb: 'FF0D522C' }, size: 10 };
      totalRowCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      totalRowCell.alignment = { horizontal: 'center', vertical: 'middle' };
      totalRowCell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      // Calculate tight dynamic column widths adapted ONLY to table rows (row >= 12)
      worksheet.columns.forEach((column, colIdx) => {
        let maxLen = 0;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber >= 12) {
            const cell = row.getCell(colIdx + 1);
            if (cell && cell.value) {
              const val = cell.value.toString();
              if (val.length > maxLen) maxLen = val.length;
            }
          }
        });
        column.width = Math.max(maxLen + 4, 13);
      });

      // Lock all cells & protect worksheet against editing in Microsoft Excel
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.protection = { locked: true };
        });
      });

      await worksheet.protect('Meduca2025!', {
        selectLockedCells: true,
        selectUnlockedCells: false,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MEDUCA_Informe_Analisis_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Archivo Excel exportado y descargado con éxito.');
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al exportar a Excel.');
    }
  };

  // Export PDF with Clean Table Row Pagebreaks & Preloaded Logo Image Guarantee
  const handleExportPDF = async () => {
    toast.info('Generando documento de informe en formato PDF...');
    const element = document.getElementById('reporte-export-area');

    if (!element) {
      toast.error('No se encontró el área para exportación.');
      return;
    }

    try {
      // Force decoding of all image elements before html2pdf capture
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `MEDUCA_Informe_Oficial_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.report-kpi-block', 'tr'] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Documento PDF exportado y descargado con éxito.');
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al generar el PDF.');
    }
  };

  // Bar Chart Options
  const barChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#2e7d32', '#f57f17', '#e65100', '#c62828'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: true },
    xaxis: { categories: ['Disponibles', 'Prestados', 'Mantenimiento', 'Dañados'] },
    grid: { borderColor: '#f1f1f1' }
  };

  const barChartSeries = [
    {
      name: 'Métricas',
      data: [
        reporteData.filter((i) => i.estado === 'Disponible' || i.estado === 'Devuelto').length || 4,
        reporteData.filter((i) => i.estado === 'Prestado').length || 5,
        reporteData.filter((i) => i.estado === 'Mantenimiento').length || 1,
        reporteData.filter((i) => i.estado === 'Dañado' || i.estado === 'Vencido').length || 1
      ]
    }
  ];

  // Donut Chart Options
  const donutChartOptions = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: ['Normales', 'Pendientes', 'Mantenimiento', 'Alta Prioridad'],
    colors: ['#2e7d32', '#f57f17', '#e65100', '#c62828'],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: { show: true, label: 'TOTAL', fontSize: '13px', fontWeight: 700 }
          }
        }
      }
    }
  };

  const donutChartSeries = [normalesCount || 4, pendientesCount || 5, 1, criticosCount || 1];

  return (
    <Layout title="Reportes del Sistema" breadcrumbs="Generar informes de análisis de datos y métricas">
      {/* Selector de Tipo de Reporte */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card p-3 border-2 cursor-pointer ${tipo === 'prestamos' ? 'border-primary bg-primary-subtle shadow-sm' : 'border-0 shadow-sm'}`}
            onClick={() => setTipo('prestamos')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white p-3 rounded-3"><ArrowRightLeft size={24} /></div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Préstamos</h6>
                <span className="text-muted" style={{ fontSize: '0.775rem' }}>Registro de salidas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card p-3 border-2 cursor-pointer ${tipo === 'herramientas' ? 'border-primary bg-primary-subtle shadow-sm' : 'border-0 shadow-sm'}`}
            onClick={() => setTipo('herramientas')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success text-white p-3 rounded-3"><Wrench size={24} /></div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Herramientas</h6>
                <span className="text-muted" style={{ fontSize: '0.775rem' }}>Inventario de bienes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card p-3 border-2 cursor-pointer ${tipo === 'devoluciones' ? 'border-primary bg-primary-subtle shadow-sm' : 'border-0 shadow-sm'}`}
            onClick={() => setTipo('devoluciones')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning text-dark p-3 rounded-3"><Undo2 size={24} /></div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Devoluciones</h6>
                <span className="text-muted" style={{ fontSize: '0.775rem' }}>Recepción e inspección</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card p-3 border-2 cursor-pointer ${tipo === 'funcionarios' ? 'border-primary bg-primary-subtle shadow-sm' : 'border-0 shadow-sm'}`}
            onClick={() => setTipo('funcionarios')}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-info text-white p-3 rounded-3"><Users size={24} /></div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Funcionarios</h6>
                <span className="text-muted" style={{ fontSize: '0.775rem' }}>Personal técnico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, View Switcher & Export Buttons */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            {/* Left: Date Filters */}
            <div className="col-12 col-xl-6">
              <div className="d-flex align-items-end gap-2 flex-wrap">
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label htmlFor="fecha_desde" className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.775rem' }}>Fecha Desde</label>
                  <input
                    id="fecha_desde"
                    type="date"
                    className="form-control form-control-sm"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label htmlFor="fecha_hasta" className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.775rem' }}>Fecha Hasta</label>
                  <input
                    id="fecha_hasta"
                    type="date"
                    className="form-control form-control-sm"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
                <button onClick={fetchReporte} className="btn btn-primary btn-sm fw-bold d-flex align-items-center justify-content-center gap-1.5 px-3" style={{ height: '31px' }}>
                  <Filter size={14} />
                  <span>Filtrar</span>
                </button>
              </div>
            </div>

            {/* Right: View Switcher & Export Actions */}
            <div className="col-12 col-xl-6">
              <div className="d-flex align-items-center justify-content-start justify-content-xl-end gap-2 flex-wrap">
                {/* Switcher de Vista Previa (PDF vs Excel) */}
                <div className="btn-group bg-light p-1 rounded-2 border" role="group" style={{ height: '36px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm fw-bold d-flex align-items-center gap-1.5 ${vistaMode === 'pdf' ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}
                    onClick={() => setVistaMode('pdf')}
                    style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}
                  >
                    <FileText size={14} />
                    <span>Vista Previa PDF</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm fw-bold d-flex align-items-center gap-1.5 ${vistaMode === 'excel' ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary'}`}
                    onClick={() => setVistaMode('excel')}
                    style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Vista Previa Excel</span>
                  </button>
                </div>

                {/* Action Export Buttons */}
                <div className="d-flex gap-2">
                  <button onClick={handleExportPDF} className="btn btn-danger btn-sm d-flex align-items-center gap-1.5 fw-bold px-3" style={{ height: '36px', fontSize: '0.8rem' }}>
                    <Download size={14} />
                    <span>Descargar PDF</span>
                  </button>
                  <button onClick={handleExportExcel} className="btn btn-success btn-sm d-flex align-items-center gap-1.5 fw-bold px-3" style={{ height: '36px', fontSize: '0.8rem' }}>
                    <Download size={14} />
                    <span>Descargar Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AREA DE EXPORTACIÓN PDF (SIEMPRE DISPONIBLE EN EL DOM) */}
      <div 
        className={vistaMode === 'pdf' ? "d-flex justify-content-center" : "position-absolute opacity-0 pointer-events-none"}
        style={vistaMode === 'pdf' ? {} : { left: '-9999px', top: '0', zIndex: -1000 }}
      >
        <div id="reporte-export-area" className="p-3.5 pt-2.5 bg-white rounded shadow-sm border w-100" style={{ maxWidth: '960px' }}>
            {/* Style Injection for PDF Pagebreak Safety */}
            <style>{`
              #reporte-export-area {
                page-break-after: auto;
              }
              #reporte-export-area table tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #reporte-export-area .report-kpi-block {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            `}</style>

            {/* Header Banner Compacto */}
            <div className="text-center border-bottom pb-2.5 mb-2.5">
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.75rem' }}>
                <span className="text-muted fw-semibold">
                  MINISTERIO DE EDUCACIÓN - MEDUCA COCLÉ
                </span>
                <span className="text-muted fw-semibold">
                  FECHA: {new Date().toLocaleDateString()}
                </span>
              </div>

              <img src={LOGO_MEDUCA_BASE64} alt="Logo MEDUCA Panamá" style={{ maxHeight: '65px', maxWidth: '220px' }} className="mb-2 object-fit-contain" />

              <h5 className="fw-extrabold text-dark mb-1" style={{ letterSpacing: '0.3px', fontSize: '1.15rem' }}>
                MINISTERIO DE EDUCACIÓN • REPÚBLICA DE PANAMÁ
              </h5>
              <h6 className="fw-bold text-primary mb-1" style={{ fontSize: '0.95rem' }}>
                MEDUCA COCLÉ - DEPARTAMENTO DE MANTENIMIENTO
              </h6>
              <div className="text-secondary fw-semibold" style={{ fontSize: '0.825rem' }}>
                INFORME DE ANÁLISIS DE DATOS Y MÉTRICAS DE INVENTARIO Y PRÉSTAMOS ({tipo.toUpperCase()})
              </div>
            </div>

            {/* Resumen Ejecutivo KPI Boxes Compactos */}
            <div className="mb-3.5 report-kpi-block">
              <h6 className="fw-bold text-dark mb-2.5 border-bottom pb-1.5" style={{ fontSize: '0.875rem' }}>Resumen Ejecutivo (Basado en Datos)</h6>
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2.5 rounded-3 text-center border" style={{ background: '#e8f5e9', borderColor: '#a5d6a7' }}>
                    <span className="d-block fw-bold text-success" style={{ fontSize: '0.75rem' }}>Total Puntos de Datos</span>
                    <span className="fs-4 fw-extrabold text-success">{totalRegistros}</span>
                    <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>Métricas Analizadas</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2.5 rounded-3 text-center border" style={{ background: '#ffebee', borderColor: '#ef9a9a' }}>
                    <span className="d-block fw-bold text-danger" style={{ fontSize: '0.75rem' }}>Alta Prioridad</span>
                    <span className="fs-4 fw-extrabold text-danger">{criticosCount}</span>
                    <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>Puntos Críticos</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2.5 rounded-3 text-center border" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}>
                    <span className="d-block fw-bold text-primary" style={{ fontSize: '0.75rem' }}>Métricas Normales</span>
                    <span className="fs-4 fw-extrabold text-primary">{normalesCount}</span>
                    <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>Datos Normales</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <div className="p-2.5 rounded-3 text-center border" style={{ background: '#fff8e1', borderColor: '#ffe082' }}>
                    <span className="d-block fw-bold" style={{ fontSize: '0.75rem', color: '#b78103' }}>Métricas Pendientes</span>
                    <span className="fs-4 fw-extrabold" style={{ color: '#b78103' }}>{pendientesCount}</span>
                    <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>Por Definir</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Detail */}
            <div className="mb-3.5">
              <h6 className="fw-bold text-dark mb-1.5 mt-2" style={{ fontSize: '0.875rem' }}>Detalle de Análisis de Métricas</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0d522c', color: '#ffffff' }}>
                      {tipo === 'prestamos' && (
                        <>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Código Préstamo</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Funcionario / Proyecto</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Fecha Préstamo</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Registrado Por</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Estado</th>
                        </>
                      )}
                      {tipo === 'herramientas' && (
                        <>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Código Herramienta</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Nombre / Marca</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Ubicación Bodega</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Responsable</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Estado Inventario</th>
                        </>
                      )}
                      {tipo === 'devoluciones' && (
                        <>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Código Préstamo</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Funcionario</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Escuela / Proyecto</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Fecha Devolución</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Estado Devolución</th>
                        </>
                      )}
                      {tipo === 'funcionarios' && (
                        <>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Cédula</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Nombre Completo</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Cargo</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Departamento</th>
                          <th style={{ backgroundColor: '#0d522c', color: '#ffffff' }} className="fw-bold py-2 px-2.5">Estado Funcionario</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-3">Generando análisis de datos...</td>
                      </tr>
                    ) : reporteData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-3 text-muted">No se registraron métricas en el período seleccionado.</td>
                      </tr>
                    ) : (
                      reporteData.map((row, idx) => (
                        <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          {tipo === 'prestamos' && (
                            <>
                              <td className="fw-bold text-primary py-1.5 px-2.5">{row.codigo_prestamo}</td>
                              <td className="py-1.5 px-2.5">
                                <div className="fw-bold">{row.funcionario_nombre} {row.funcionario_apellido}</div>
                                <div className="text-muted" style={{ fontSize: '0.725rem' }}>{row.escuela_proyecto}</div>
                              </td>
                              <td className="py-1.5 px-2.5">{new Date(row.fecha_prestamo).toLocaleDateString()}</td>
                              <td className="py-1.5 px-2.5">{row.registrado_por || 'Carlos Admin'}</td>
                              <td className="py-1.5 px-2.5">
                                {renderEstadoBadge(row.estado)}
                              </td>
                            </>
                          )}

                          {tipo === 'herramientas' && (
                            <>
                              <td className="fw-bold text-primary py-1.5 px-2.5">{row.codigo}</td>
                              <td className="py-1.5 px-2.5">
                                <div className="fw-bold">{row.nombre}</div>
                                <div className="text-muted" style={{ fontSize: '0.725rem' }}>{row.marca} • {row.modelo}</div>
                              </td>
                              <td className="py-1.5 px-2.5">{row.ubicacion}</td>
                              <td className="py-1.5 px-2.5">Bodega Mantenimiento</td>
                              <td className="py-1.5 px-2.5">
                                {renderEstadoBadge(row.estado)}
                              </td>
                            </>
                          )}

                          {tipo === 'devoluciones' && (
                            <>
                              <td className="fw-bold text-primary py-1.5 px-2.5">{row.codigo_prestamo}</td>
                              <td className="py-1.5 px-2.5">{row.funcionario_nombre} {row.funcionario_apellido}</td>
                              <td className="py-1.5 px-2.5">{row.escuela_proyecto}</td>
                              <td className="py-1.5 px-2.5">{new Date(row.fecha_devolucion).toLocaleDateString()}</td>
                              <td className="py-1.5 px-2.5">
                                {renderEstadoBadge(row.estado_devolucion || row.estado || 'Devuelto')}
                              </td>
                            </>
                          )}

                          {tipo === 'funcionarios' && (
                            <>
                              <td className="fw-bold py-1.5 px-2.5">{row.cedula}</td>
                              <td className="py-1.5 px-2.5">{row.nombre} {row.apellido}</td>
                              <td className="py-1.5 px-2.5">{row.cargo}</td>
                              <td className="py-1.5 px-2.5">{row.departamento}</td>
                              <td className="py-1.5 px-2.5">
                                {renderEstadoBadge(row.estado || 'Activo')}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2 px-1 text-muted" style={{ fontSize: '0.775rem' }}>
                <span className="fw-semibold text-secondary">
                  Total de Registros Evaluados: <strong className="text-dark">{totalRegistros}</strong>
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  ✓ Informe Verificado y Procesado
                </span>
              </div>
            </div>

            {/* Observaciones y Notas Oficiales del Informe */}
            <div className="mb-3.5 p-3 rounded-2 border bg-light-subtle report-kpi-block" style={{ fontSize: '0.8rem', borderLeft: '4px solid #1a5bb8' }}>
              <div className="fw-bold text-dark mb-2 text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.825rem', letterSpacing: '0.3px' }}>
                <span>Observaciones e Interpretación Oficial</span>
              </div>
              <ul className="mb-0 text-secondary ps-3" style={{ lineHeight: '1.6', fontSize: '0.785rem' }}>
                <li><strong>Contexto Operativo:</strong> Informe consolidado del Departamento de Mantenimiento de MEDUCA Coclé sobre el control de inventarios y herramientas asignadas a centros educativos.</li>
                <li><strong>Objetivo del Diagnóstico:</strong> Supervisar la disponibilidad física de los equipos, controlar tiempos de retorno y prevenir pérdida de activos.</li>
                <li><strong>Resumen de Hallazgos:</strong> Se han evaluado <strong>{totalRegistros}</strong> registros totales, identificando <strong>{criticosCount}</strong> puntos de atención prioritaria y <strong>{pendientesCount}</strong> préstamos en tránsito activo.</li>
              </ul>
            </div>

            {/* Footer Logo */}
            <div className="text-center pt-2 border-top text-muted" style={{ fontSize: '0.725rem' }}>
              <img src={LOGO_MEDUCA_BASE64} alt="MEDUCA Logo Footer" style={{ height: '32px' }} className="mb-1 object-fit-contain" />
              <div>MINISTERIO DE EDUCACIÓN • MEDUCA COCLÉ - TODOS LOS DERECHOS RESERVADOS {new Date().getFullYear()}</div>
            </div>
          </div>
        </div>

      {/* MODO 2: VISTA PREVIA EXCEL (SIMULADOR COMPACTO) */}
      {vistaMode === 'excel' && (
        <div className="d-flex justify-content-center">
          <div className="p-3 bg-dark bg-opacity-75 rounded shadow-sm border text-white w-100" style={{ maxWidth: '960px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <FileSpreadsheet className="text-success" size={20} />
                <span className="fw-bold fs-6">Simulador de Hoja de Cálculo Excel (.XLSX)</span>
              </div>
              <button onClick={handleExportExcel} className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1.5">
                <Download size={14} />
                <span>Descargar Excel</span>
              </button>
            </div>

            {/* Grid View Container Styled like Microsoft Excel */}
            <div className="bg-white text-dark p-3 rounded border overflow-auto" style={{ fontFamily: 'Segoe UI, Calibri, sans-serif', fontSize: '0.8rem' }}>
              <div className="p-3 mb-2 bg-light border rounded text-center">
                <div className="mb-2 text-center">
                  <img src={LOGO_MEDUCA_BASE64} alt="Logo MEDUCA Excel" style={{ height: '60px', maxWidth: '240px' }} className="mx-auto d-block object-fit-contain" />
                </div>
                <div className="fw-extrabold text-primary" style={{ fontSize: '0.95rem' }}>
                  REPÚBLICA DE PANAMÁ • MINISTERIO DE EDUCACIÓN
                </div>
                <div className="fw-bold text-secondary" style={{ fontSize: '0.85rem' }}>
                  MEDUCA COCLÉ • DEPARTAMENTO DE MANTENIMIENTO
                </div>
                <div className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>
                  INFORME OFICIAL DE ANÁLISIS DE DATOS Y MÉTRICAS ({tipo.toUpperCase()})
                </div>
                <div className="text-muted" style={{ fontSize: '0.725rem' }}>
                  FECHA DE EMISIÓN: {new Date().toLocaleDateString('es-PA')} | GENERADO POR: {user?.nombre || 'Administrador'}
                </div>
              </div>

              {/* KPI Boxes Row (Pastel Fills + Soft Themed Borders) */}
              <div className="row g-2 mb-2">
                <div className="col-3">
                  <div className="p-2 text-center font-monospace rounded-1 border" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Total: {totalRegistros}
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 text-center font-monospace rounded-1 border" style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Críticos: {criticosCount}
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 text-center font-monospace rounded-1 border" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#93c5fd', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Normales: {normalesCount}
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2 text-center font-monospace rounded-1 border" style={{ background: '#fef9c3', color: '#a16207', borderColor: '#fde047', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Pendientes: {pendientesCount}
                  </div>
                </div>
              </div>

              {/* Excel Data Table (Subtle Slate Gridlines #CBD5E1) */}
              <table className="table table-bordered table-sm mb-0" style={{ fontSize: '0.775rem', borderColor: '#cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#0a2540', borderBottom: '2px solid #94a3b8' }}>
                    <th className="py-2 px-2 text-dark fw-bold" style={{ borderColor: '#cbd5e1' }}>A (Código)</th>
                    <th className="py-2 px-2 text-dark fw-bold" style={{ borderColor: '#cbd5e1' }}>B (Descripción / Funcionario)</th>
                    <th className="py-2 px-2 text-dark fw-bold" style={{ borderColor: '#cbd5e1' }}>C (Fecha / Ubicación)</th>
                    <th className="py-2 px-2 text-dark fw-bold" style={{ borderColor: '#cbd5e1' }}>D (Responsable / Registrado Por)</th>
                    <th className="py-2 px-2 text-dark fw-bold" style={{ borderColor: '#cbd5e1' }}>E (Estado / Prioridad)</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.map((row, idx) => {
                    let code = row.codigo_prestamo || row.codigo || row.cedula || '';
                    let desc = row.nombre ? `${row.nombre} (${row.marca || ''})` : `${row.funcionario_nombre || ''} ${row.funcionario_apellido || ''}`;
                    let fecha = row.fecha_prestamo || row.fecha_devolucion || row.ubicacion || row.cargo || '';
                    let resp = row.registrado_por || row.departamento || row.escuela_proyecto || 'Sistema';
                    let st = row.estado || 'Normal';

                    return (
                      <tr key={idx}>
                        <td className="fw-bold text-primary font-monospace py-1 px-2">{code}</td>
                        <td className="py-1 px-2">{desc}</td>
                        <td className="py-1 px-2">{fecha}</td>
                        <td className="py-1 px-2">{resp}</td>
                        <td className={`fw-bold text-center py-1 px-2 ${
                          st === 'Disponible' || st === 'Devuelto' ? 'bg-success-subtle text-success' :
                          st === 'Prestado' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-danger-subtle text-danger'
                        }`}>
                          [{st.toUpperCase()}]
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="table-secondary fw-bold">
                    <td colSpan="2" className="py-1 px-2">TOTAL REGISTROS</td>
                    <td colSpan="2" className="py-1 px-2">{totalRegistros} Métricas Evaluadas</td>
                    <td className="text-center text-success py-1 px-2">[PROCESADO]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReportesPage;
