import CreatableSelect from 'react-select/creatable';
import { useEffect, useState } from 'react';

const MetaKeywordsInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [keywords, setKeywords] = useState([]);

  // 🔥 Sync parent value → internal state
  useEffect(() => {
    if (!value) {
      // RESET CASE
      setKeywords([]);
      setInputValue('');
      return;
    }

    const parsed = value
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .map(k => ({ label: k, value: k }));

    setKeywords(parsed);
  }, [value]);

  const updateDbValue = (items) => {
    onChange(items.map(i => i.value).join(','));
  };

  const handleKeyDown = (e) => {
    if (e.key === ',') {
      e.preventDefault();

      const val = inputValue.trim();
      if (!val) return;

      if (keywords.some(k => k.value === val)) {
        setInputValue('');
        return;
      }

      const newKeywords = [...keywords, { label: val, value: val }];
      setKeywords(newKeywords);
      updateDbValue(newKeywords);
      setInputValue('');
    }
  };

  const handleChange = (selected) => {
    const items = selected || [];
    setKeywords(items);
    updateDbValue(items);
  };

  return (
    <CreatableSelect
      isMulti
      value={keywords}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      menuIsOpen={false}
      components={{ DropdownIndicator: null }}
      placeholder="Type keyword and add comma"
    />
  );
};

export default MetaKeywordsInput;
