import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

const BuyerStockChart = () => {
  const [chartDataSets, setChartDataSets] = useState([]);

  useEffect(() => {
    // Fetch seller chart data from backend
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/buyers/chart`); // Adjust endpoint
        const data = response.data;

        // Transform backend data into datasets for AmCharts
        const Active = data.map(item => ({ date: new Date(item.date), value: item.Active || 0, volume: item.Active || 0 }));
const Inactive = data.map(item => ({ date: new Date(item.date), value: item.Inactive || 0, volume: item.Inactive || 0 }));
const NotApproved = data.map(item => ({ date: new Date(item.date), value: item.NotApproved || 0, volume: item.NotApproved || 0 }));
const Deleted = data.map(item => ({ date: new Date(item.date), value: item.Deleted || 0, volume: item.Deleted || 0 }));

        setChartDataSets([
          { title: "Active", dataProvider: Active },
          { title: "Inactive", dataProvider: Inactive },
          { title: "Not Approved", dataProvider: NotApproved },
          { title: "Deleted", dataProvider: Deleted },
        ]);
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    if (!chartDataSets.length) return;

    const chart = window.AmCharts.makeChart("buyerChartdiv", {
      type: "stock",
      theme: "none",

      dataSets: chartDataSets.map(set => ({
        title: set.title,
        fieldMappings: [
          { fromField: "value", toField: "value" },
          { fromField: "volume", toField: "volume" }
        ],
        dataProvider: set.dataProvider,
        categoryField: "date"
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
              balloonText: "[[title]]:<b>[[value]]</b>",
              compareGraphBalloonText: "[[title]]:<b>[[value]]</b>"
            }
          ],
          stockLegend: {
            periodValueTextComparing: "[[percents.value.close]]%",
            periodValueTextRegular: "[[value.close]]"
          }
        },
        {
          title: "Volume",
          percentHeight: 30,
          stockGraphs: [
            {
              valueField: "volume",
              type: "column",
              showBalloon: false,
              fillAlphas: 1
            }
          ],
          stockLegend: {
            periodValueTextRegular: "[[value.close]]"
          }
        }
      ],

      chartScrollbarSettings: { graph: "g1" },
      chartCursorSettings: {
        valueBalloonsEnabled: true,
        fullWidth: true,
        cursorAlpha: 0.1,
        valueLineBalloonEnabled: true,
        valueLineEnabled: true,
        valueLineAlpha: 0.5
      },

      periodSelector: {
        position: "left",
        periods: [
          { period: "MM", count: 1, selected: true, label: "1 month" },
          { period: "YYYY", count: 1, label: "1 year" },
          { period: "YTD", label: "YTD" },
          { period: "MAX", label: "MAX" }
        ]
      },

      dataSetSelector: { position: "left" },
      export: { enabled: true }
    });

    return () => {
      if (chart) chart.clear();
    };
  }, [chartDataSets]);

  useEffect(() => {
  const container = document.getElementById("buyerChartdiv");
  if (!container) return;

  const applyCompareStyles = () => {
    // Set fixed height for compare divs
    document.querySelectorAll(".amcharts-compare-div").forEach(div => {
      div.style.height = "100px"; // set your desired height
    });

    // Set fixed height for compare item divs
    document.querySelectorAll(".amcharts-compare-item-div").forEach(div => {
      div.style.height = "25px"; // set your desired height
    });
  };

  // Initial apply after chart renders
  setTimeout(applyCompareStyles, 500);

  // Observe changes in the chart container
  const observer = new MutationObserver(applyCompareStyles);
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"]
  });

  return () => observer.disconnect();
}, [chartDataSets]);

  useEffect(() => {
  const updateCompareDivs = () => {
    document.querySelectorAll(
      ".amcharts-data-set-select, .amcharts-start-date-input, .amcharts-end-date-input"
    ).forEach(el => el.classList.add("form-control"));
  };

  // Small delay to ensure chart is rendered
  setTimeout(updateCompareDivs, 500);
}, [chartDataSets]);

useEffect(() => {
  const applyButtonClasses = () => {
    document.querySelectorAll(".amcharts-period-input").forEach(el => {
      if (!el.classList.contains("btn")) el.classList.add("btn", "btn-primary", "mb-1");
    });

    document.querySelectorAll(".amcharts-period-input-selected").forEach(el => {
      if (!el.classList.contains("btn-success")) el.classList.add("btn", "btn-success", "mb-1", "active");
      // Remove btn-primary if selected
      el.classList.remove("btn-primary");
    });
  };

  // Run initially
  setTimeout(applyButtonClasses, 500);

  // Watch for changes every 100ms (or use MutationObserver for efficiency)
  const interval = setInterval(applyButtonClasses, 100);

  return () => clearInterval(interval);
}, [chartDataSets]);

  return <div id="buyerChartdiv" style={{ width: "100%", height: "600px" }} className="my-3" />;
};

export default BuyerStockChart;
