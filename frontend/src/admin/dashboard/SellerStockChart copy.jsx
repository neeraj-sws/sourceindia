import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

const SellerStockChart = () => {
  const [chartDataSets, setChartDataSets] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("MM");

  useEffect(() => {
    // Fetch seller chart data from backend
    const fetchChartData = async () => {
      try {
        let url = `${API_BASE_URL}/sellers/chart`;
        let allActiveData = [];
        if (selectedPeriod === "ALLACTIVE") {
          url += "?type=ALLACTIVE";
          const response = await axios.get(url);
          console.log("ALLACTIVE API response:", response.data);
          allActiveData = response.data.map(item => {
            // Strict date parsing: only accept YYYY-MM-DD
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
          console.log("Mapped ALLACTIVE data (filtered):", allActiveData);
          if (!allActiveData.length) {
            alert("No valid data available for Overall period! Please check backend response.");
            setChartDataSets([]);
            return;
          }
          setChartDataSets([
            { title: "All Active Sellers", dataProvider: allActiveData }
          ]);
          return;
        }
        const response = await axios.get(url);
        const data = response.data;
        // Transform backend data into datasets for AmCharts
        const Active = data.map(item => ({ date: new Date(item.date), value: item.Active || 0, volume: item.Active || 0 }));
        const Inactive = data.map(item => ({ date: new Date(item.date), value: item.Inactive || 0, volume: item.Inactive || 0 }));
        const NotApproved = data.map(item => ({ date: new Date(item.date), value: item.NotApproved || 0, volume: item.NotApproved || 0 }));
        const NotCompleted = data.map(item => ({ date: new Date(item.date), value: item.NotCompleted || 0, volume: item.NotCompleted || 0 }));
        const Deleted = data.map(item => ({ date: new Date(item.date), value: item.Deleted || 0, volume: item.Deleted || 0 }));
        setChartDataSets([
          { title: "Active", dataProvider: Active },
          { title: "Inactive", dataProvider: Inactive },
          { title: "Not Approved", dataProvider: NotApproved },
          { title: "Not Completed", dataProvider: NotCompleted },
          { title: "Deleted", dataProvider: Deleted },
        ]);
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };
    fetchChartData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (!chartDataSets.length) return;

    // Find min/max date for ALLACTIVE (Overall)
    let minDate = null, maxDate = null;
    if (selectedPeriod === "ALLACTIVE" && chartDataSets[0] && chartDataSets[0].dataProvider.length) {
      // Find the first non-zero value date for 'From'
      const allActiveData = chartDataSets[0].dataProvider;
      const firstNonZero = allActiveData.find(d => d.value > 0);
      minDate = firstNonZero ? firstNonZero.date : allActiveData[0].date;
      maxDate = allActiveData[allActiveData.length - 1].date;
      console.log("ALLACTIVE minDate:", minDate, "maxDate:", maxDate, "allActiveData:", allActiveData);
      if (!allActiveData.length) console.warn("ALLACTIVE dataProvider is empty!");
      if (minDate instanceof Date && isNaN(minDate)) console.warn("minDate is Invalid Date!");
    }

    const chart = window.AmCharts.makeChart("sellerChartdiv", {
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
          { period: "MAX", selected: selectedPeriod === "ALLACTIVE", label: "Overall" },
          { period: "MM", count: 1, selected: selectedPeriod === "MM", label: "1 month" },
          { period: "YYYY", count: 1, selected: selectedPeriod === "YYYY", label: "1 year" },
          { period: "YTD", selected: selectedPeriod === "YTD", label: "YTD" },
          { period: "MAX", selected: selectedPeriod === "MAX", label: "MAX" }
        ],
        // For 'Overall', only set startDate if valid
        ...(selectedPeriod === "ALLACTIVE" && minDate instanceof Date && !isNaN(minDate) ? { startDate: minDate } : {}),
        ...(selectedPeriod === "ALLACTIVE" && maxDate instanceof Date && !isNaN(maxDate) ? { endDate: maxDate } : {})
      },

      dataSetSelector: { position: "left" },
      export: { enabled: true }
    });
    // Listen for period change
    chart.addListener("periodSelectorChanged", function (event) {
      if (event && event.period) {
        setSelectedPeriod(event.period);
      }
    });
    return () => {
      if (chart) chart.clear();
    };
  }, [chartDataSets, selectedPeriod]);

  useEffect(() => {
    const container = document.getElementById("sellerChartdiv");
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

  // Custom 'From' date display for ALLACTIVE
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
      <div id="sellerChartdiv" style={{ width: "100%", height: "600px" }} className="my-3" />
    </>
  );
};

export default SellerStockChart;
