import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

const EnquiryStockChart = () => {
  const [chartDataSets, setChartDataSets] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/enquiries/chart`);
        const data = response.data;

        const Approved = data.map(item => ({
          date: new Date(item.date),
          value: item.Approved || 0,
          volume: item.Approved || 0,
        }));

        const NotApproved = data.map(item => ({
          date: new Date(item.date),
          value: item.NotApproved || 0,
          volume: item.NotApproved || 0,
        }));

        setChartDataSets([
          { title: "Approved", dataProvider: Approved },
          { title: "Not Approved", dataProvider: NotApproved },
        ]);
      } catch (err) {
        console.error("Error fetching enquiry chart data:", err);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    if (!chartDataSets.length) return;

    const chart = window.AmCharts.makeChart("enquiryChartDiv", {
      type: "stock",
      theme: "none",

      dataSets: chartDataSets.map(set => ({
        title: set.title,
        fieldMappings: [
          { fromField: "value", toField: "value" },
          { fromField: "volume", toField: "volume" },
        ],
        dataProvider: set.dataProvider,
        categoryField: "date",
      })),

      panels: [
        {
          showCategoryAxis: false,
          title: "Value",
          percentHeight: 70,
          stockGraphs: [
            {
              id: "g1",
              valueField: "value",
              comparable: true,
              compareField: "value",
              balloonText: "[[title]]: <b>[[value]]</b>",
              compareGraphBalloonText: "[[title]]: <b>[[value]]</b>",
            },
          ],
          stockLegend: {
            periodValueTextComparing: "[[percents.value.close]]%",
            periodValueTextRegular: "[[value.close]]",
          },
        },
        {
          title: "Volume",
          percentHeight: 30,
          stockGraphs: [
            {
              valueField: "volume",
              type: "column",
              showBalloon: false,
              fillAlphas: 1,
            },
          ],
          stockLegend: {
            periodValueTextRegular: "[[value.close]]",
          },
        },
      ],

      chartScrollbarSettings: { graph: "g1" },
      chartCursorSettings: {
        valueBalloonsEnabled: true,
        fullWidth: true,
        cursorAlpha: 0.1,
        valueLineBalloonEnabled: true,
        valueLineEnabled: true,
        valueLineAlpha: 0.5,
      },

      periodSelector: {
        position: "left",
        periods: [
          { period: "MM", count: 1, selected: true, label: "1 month" },
          { period: "YYYY", count: 1, label: "1 year" },
          { period: "YTD", label: "YTD" },
          { period: "MAX", label: "MAX" },
        ],
      },

      dataSetSelector: { position: "left" },
      export: { enabled: true },
    });

    return () => {
      if (chart) chart.clear();
    };
  }, [chartDataSets]);

  return (
    <div
      id="enquiryChartDiv"
      style={{ width: "100%", height: "600px" }}
      className="my-3"
    />
  );
};

export default EnquiryStockChart;
