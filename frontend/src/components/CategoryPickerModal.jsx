import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function CategoryPickerModal({ show, onClose, onSelect }) {
	const [data, setData] = useState([]);
	const [expanded, setExpanded] = useState({});
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState('');
	const [error, setError] = useState(null);
	const [selection, setSelection] = useState({ categoryId: null, categoryName: '', subId: null, subName: '', itemCategoryId: null, itemCategoryName: '' });

	useEffect(() => {
		if (!show) return;
		let mounted = true;
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await axios.get(`${API_BASE_URL}/categories/category-item`);
				if (!mounted) return;
				setData(res.data || []);
			} catch (err) {
				if (!mounted) return;
				setError(err.message || 'Failed to load categories');
			} finally {
				if (mounted) setLoading(false);
			}
		};
		fetchData();
		return () => { mounted = false; };
	}, [show]);

	useEffect(() => {
		if (!show) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.body.classList.add('modal-open');

		const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
		document.addEventListener('keydown', onKey);

		return () => {
			document.body.style.overflow = originalOverflow || '';
			document.body.classList.remove('modal-open');
			document.removeEventListener('keydown', onKey);
		};
	}, [show]);

	const pickerModalDialogRef = useRef(null);

	useEffect(() => {
		if (show && pickerModalDialogRef.current) {
			try { pickerModalDialogRef.current.focus(); } catch (e) {}
		}
		if (show) setQuery('');
	}, [show]);

	const toggle = (id) => setExpanded(s => ({ ...s, [id]: !s[id] }));

	const handleSelect = (catId, catName, subId, subName, itemCategoryId, itemCategoryName) => {
		setSelection({ categoryId: catId || null, categoryName: catName || '', subId: subId || null, subName: subName || '', itemCategoryId: itemCategoryId || null, itemCategoryName: itemCategoryName || '' });
	};

	const handleConfirm = () => {
		onSelect && onSelect({
			category: selection.categoryId || '',
			categoryName: selection.categoryName || '',
			sub_category: selection.subId || '',
			subName: selection.subName || '',
			item_category_id: selection.itemCategoryId || '',
			itemCategoryName: selection.itemCategoryName || ''
		});
		onClose && onClose();
	};

	const clearSelection = () => setSelection({ categoryId: null, categoryName: '', subId: null, subName: '', itemCategoryId: null, itemCategoryName: '' });

	if (!show) return null;

	const filteredData = (() => {
		if (!query) return data || [];
		const q = query.toLowerCase();
		return (data || []).map(cat => {
			const subcategories = (cat.subcategories || []).map(sub => {
				const matchedItems = (sub.item_categories || []).filter(ic => (ic.name || '').toLowerCase().includes(q));
				const subMatch = (sub.name || '').toLowerCase().includes(q);
				if (subMatch || matchedItems.length) return { ...sub, item_categories: matchedItems };
				return null;
			}).filter(Boolean);
			const catMatch = (cat.name || '').toLowerCase().includes(q);
			if (catMatch || subcategories.length) return { ...cat, subcategories };
			return null;
		}).filter(Boolean);
	})();

	const modalContent = (
		<div
			className="modal fade show"
			tabIndex={-1}
			role="dialog"
			aria-modal="true"
			style={{ display: 'block', zIndex: 100000, pointerEvents: 'auto' }}
		>
			<div
				className="modal-dialog modal-lg modal-dialog-centered"
				role="document"
				style={{ maxWidth: '900px', pointerEvents: 'auto' }}
			>
				<div
					className="modal-content"
					style={{ pointerEvents: 'auto' }}
					ref={pickerModalDialogRef}
					tabIndex={-1}
					onMouseDown={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="modal-header">
						<h5 className="modal-title">Category Picker</h5>
						<button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
					</div>
						<div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
							<div className="mb-3">
								<input type="search" className="form-control" placeholder="Search categories, subcategories, item categories" value={query} onChange={(e) => setQuery(e.target.value)} />
							</div>
							{loading && <div>Loading...</div>}
							{error && <div className="text-danger">{error}</div>}
							{!loading && !error && (
								<div>
									{filteredData.map(cat => (
									<div key={cat.id} className="mb-2">
										<div className="d-flex align-items-center">
											{cat.subcategories && cat.subcategories.length > 0 && (
												<button type="button" className="btn btn-sm btn-link me-2 p-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(cat.id); }}>
													{expanded[cat.id] ? '▾' : '▸'}
												</button>
											)}
											<div><strong>{cat.name}</strong></div>
										</div>
										{expanded[cat.id] && cat.subcategories && (
											<div className="ms-3 mt-2">
												{cat.subcategories.map(sub => (
													<div key={sub.id} className={`mb-2 p-1 rounded ${selection.subId === sub.id ? 'bg-light border' : ''}`} role="button" onClick={() => handleSelect(cat.id, cat.name, sub.id, sub.name, '', '')} style={{ cursor: 'pointer' }}>
														<div className="d-flex align-items-center">
															<div className="me-2">↳</div>
															<div className="flex-grow-1">{sub.name}</div>
															<div>
																<button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(cat.id, cat.name, sub.id, sub.name, '', ''); }}>Select Subcategory</button>
															</div>
														</div>
														{sub.item_categories && sub.item_categories.length > 0 && (
															<ul className="ms-4 mt-1 list-unstyled">
																{sub.item_categories.map(ic => (
																	<li key={ic.id} className={`d-flex justify-content-between align-items-center p-1 rounded ${selection.itemCategoryId === ic.id ? 'bg-light border' : ''}`} role="button" onClick={() => handleSelect(cat.id, cat.name, sub.id, sub.name, ic.id, ic.name)} style={{ cursor: 'pointer' }}>
																		<div>{ic.name}</div>
																		<div>
																			  <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(cat.id, cat.name, sub.id, sub.name, ic.id, ic.name); }}>Select</button>
																		</div>
																	</li>
																))}
															</ul>
														)}
													</div>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); clearSelection(); }}>Clear</button>
						<button type="button" className="btn btn-outline-secondary" onClick={(e) => { e.preventDefault(); onClose && onClose(); }}>Close</button>
						<button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleConfirm(); }} disabled={!selection.categoryId}>Confirm</button>
					</div>
				</div>
			</div>
			<div className="modal-backdrop show" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }} />
		</div>
	);

	try {
		return createPortal(modalContent, document.body);
	} catch (err) {
		console.error('CategoryPickerModal render error:', err);
		return (
			<div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<div className="modal-dialog" role="document" style={{ maxWidth: 600 }}>
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Category Picker</h5>
							<button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
						</div>
						<div className="modal-body">
							<div className="text-danger">Failed to render modal. Check console for details.</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
