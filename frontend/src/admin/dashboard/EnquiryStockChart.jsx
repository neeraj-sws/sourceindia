import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

const EnquiryStockChart = () => {
  const [chartDataSets, setChartDataSets] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("MM");

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        let url = `${API_BASE_URL}/enquiries/chart`;
        let allActiveData = [];
        if (selectedPeriod === "ALLACTIVE") {
          url += "?type=ALLACTIVE";
          const response = await axios.get(url);
          allActiveData = response.data.map(item => {
            let dateObj = null;
            if (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
              dateObj = new Date(item.date + "T00:00:00");
            }
            return {
              date: dateObj,
              value: typeof item.value === 'number' ? item.value : (parseFloat(item.value) || 0),
              volume: typeof item.value === 'number' ? item.value : (parseFloat(item.value) || 0)
            };
          }).filter(item => item.date instanceof Date && !isNaN(item.date));
          if (!allActiveData.length) {
            alert("No valid data available for Overall period! Please check backend response.");
            setChartDataSets([]);
            return;
          }
          setChartDataSets([
            { title: "All Enquiries", dataProvider: allActiveData }
          ]);
          return;
        }
        const response = await axios.get(url);
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
  }, [selectedPeriod]);

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
          { period: "ALLACTIVE", selected: selectedPeriod === "ALLACTIVE", label: "Overall" },
          { period: "MM", count: 1, selected: selectedPeriod === "MM", label: "1 month" },
          { period: "YYYY", count: 1, selected: selectedPeriod === "YYYY", label: "1 year" },
          { period: "YTD", selected: selectedPeriod === "YTD", label: "YTD" },
          { period: "MAX", selected: selectedPeriod === "MAX", label: "MAX" }
        ],
        ...(selectedPeriod === "ALLACTIVE" && chartDataSets[0] && chartDataSets[0].dataProvider.length && chartDataSets[0].dataProvider[0].date instanceof Date && !isNaN(chartDataSets[0].dataProvider[0].date)
          ? { startDate: chartDataSets[0].dataProvider[0].date } : {}),
        ...(selectedPeriod === "ALLACTIVE" && chartDataSets[0] && chartDataSets[0].dataProvider.length && chartDataSets[0].dataProvider[chartDataSets[0].dataProvider.length - 1].date instanceof Date && !isNaN(chartDataSets[0].dataProvider[chartDataSets[0].dataProvider.length - 1].date)
          ? { endDate: chartDataSets[0].dataProvider[chartDataSets[0].dataProvider.length - 1].date } : {})
      },

      dataSetSelector: { position: "left" },
      export: { enabled: true },
    });

    return () => {
      if (chart) chart.clear();
    };
  }, [chartDataSets]);

  // Custom 'From' date display for ALLACTIVE/Overall
  let customFromDate = null;
  if (selectedPeriod === "ALLACTIVE" && chartDataSets[0] && chartDataSets[0].dataProvider.length) {
    const allActiveData = chartDataSets[0].dataProvider;
    const firstNonZero = allActiveData.find(d => d.value > 0);
    const dateObj = firstNonZero ? firstNonZero.date : allActiveData[0].date;
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      // Format as DD-MM-YYYY
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      customFromDate = `${dd}-${mm}-${yyyy}`;
    }
  }

  return (
    <>
      {selectedPeriod === "ALLACTIVE" && customFromDate && (
        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          From: <span style={{ color: '#007bff' }}>{customFromDate}</span>
        </div>
      )}
      <div
        id="enquiryChartDiv"
        style={{ width: "100%", height: "600px" }}
        className="my-5"
      />
    </>
  );
};

export default EnquiryStockChart;
