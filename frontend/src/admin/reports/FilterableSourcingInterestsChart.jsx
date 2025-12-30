import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select, { components } from 'react-select';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import API_BASE_URL from "../../config";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

// ✅ Custom styles for react-select
const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: '45px',
    borderRadius: '8px',
    borderColor: '#ccc',
    boxShadow: 'none',
    '&:hover': { borderColor: '#888' },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#007bff33',
    borderRadius: '4px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#007bff',
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#007bff',
    ':hover': { backgroundColor: '#007bff', color: 'white' },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '8px',
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#007bff'
      : state.isFocused
      ? '#e6f0ff'
      : 'white',
    color: state.isSelected ? 'white' : '#333',
    cursor: 'pointer',
  }),
};

const FilterableSourcingInterestsChart = ({ type = 'category' }) => {
  const [allItems, setAllItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);

  const chartConfigMap = {
  category: {
    api: `${API_BASE_URL}/item_category/sourcing-interest-bar-graph`,
    title: 'Sourcing Interest per Category',
    placeholder: 'Select categories...',
    xAxisLabel: 'Categories',
  },
  subcategory: {
    api: `${API_BASE_URL}/item_sub_category/sourcing-interest-bar-graph`,
    title: 'Sourcing Interest per Subcategory',
    placeholder: 'Select subcategories...',
    xAxisLabel: 'Subcategories',
  },
};

const config = chartConfigMap[type];
const apiUrl = config.api;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(apiUrl);
        setOriginalData(res.data);

        const nonZeroOptions = res.data.labels
  .map((label, index) => ({
    label,
    value: label,
    count: res.data.datasets[0].data[index],
  }))
  .filter(item => item.count > 0);

setAllItems(nonZeroOptions.map(({ label, value }) => ({ label, value })));
setSelectedItems(nonZeroOptions.slice(0, 10));
        setGraphData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [apiUrl]);

  useEffect(() => {
    if (!originalData || !selectedItems.length) return;

    const filteredLabels = selectedItems.map(item => item.value);

    const labelIndexMap = originalData.labels.reduce((acc, label, idx) => {
      acc[label] = idx;
      return acc;
    }, {});

    // const filteredDatasets = originalData.datasets.map(dataset => ({
    //   ...dataset,
    //   data: filteredLabels.map(label => dataset.data[labelIndexMap[label]] || 0),
    // }));
const nonZeroLabels = [];
const nonZeroData = [];

filteredLabels.forEach(label => {
  const value = originalData.datasets[0].data[labelIndexMap[label]] || 0;
  if (value > 0) {
    nonZeroLabels.push(label);
    nonZeroData.push(value);
  }
});

setGraphData({
  labels: nonZeroLabels,
  datasets: [
    {
      ...originalData.datasets[0],
      data: nonZeroData,
    },
  ],
});

    // setGraphData({
    //   labels: filteredLabels,
    //   datasets: filteredDatasets,
    // });
  }, [selectedItems, originalData]);

  if (loading) return <p>Loading chart...</p>;
  if (!graphData || !graphData.labels?.length) return <p>No data available</p>;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, tooltip: { enabled: true }, datalabels: {
      anchor: 'end',
      align: 'top',
      color: '#333',
      font: {
        weight: 'bold',
        size: 12,
      },
      formatter: (value) => value, // shows the count
    }, },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Seller Count' } },
      x: { title: { display: true, text: config.xAxisLabel } },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <h4 style={{ marginBottom: '20px' }}>{config.title}</h4>

      {allItems.length > 30 && (
        <div style={{ marginBottom: '30px' }}>
          <Select
            isMulti
            options={allItems}
            value={selectedItems}
            onChange={setSelectedItems}
            placeholder={config.placeholder}
            styles={customStyles}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
          />
        </div>
      )}

      <div style={{ width: '100%', height: '600px' }}>
        <Bar data={graphData} options={chartOptions} />
      </div>
    </div>
  );
};

export default FilterableSourcingInterestsChart;
