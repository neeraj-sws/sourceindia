import React, { forwardRef, useImperativeHandle } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExcelExport = forwardRef(
  ({ fileName = "data.xlsx", data = [], columns = [], columnWidth = 20 }, ref) => {

    const exportExcel = (exportDataSource) => {
      if (!exportDataSource?.length || !columns.length) return;

      const exportData = exportDataSource.map((item) => {
        const row = {};
        columns.forEach(({ label, key, format }) => {
          const value = item[key];
          row[label] = format ? format(value, item) : value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = columns.map(() => ({ wch: columnWidth }));

      // Bold header
      columns.forEach((col, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = { font: { bold: true } };
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const wbout = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);
    };

    useImperativeHandle(ref, () => ({
      exportToExcel() {
        exportExcel(data); // full list
      },
      exportWithData(customData) {
        exportExcel(customData); // filtered list
      }
    }));

    return null;
  }
);

export default ExcelExport;
