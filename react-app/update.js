const fs = require('fs');
const file = 'src/pages/CandidateList.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use a regex that matches from the comment down to the closing tag of the modal overlay component, 
// up until "</div>\r\n    );\r\n};\r\n\r\nexport default CandidateList;"
const regex = /\{\/\* Classic View Filter Modal \*\/\}[\s\S]*?(?=\s*<\/div>\s*\);\s*\};\s*export default CandidateList;)/;

const newSection = `{/* Classic View Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Advanced Filters"
                maxWidth="1000px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div 
                            onClick={() => {
                                setFilterViewMode('compact');
                                setIsFilterModalOpen(false);
                                setIsFilterPopoverOpen(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}
                        >
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            </div>
                            Switch To Compact View
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span onClick={() => setLocalFilters({})} style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear Filters</span>
                            <button className="btn btn-secondary" onClick={() => setIsFilterModalOpen(false)} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Cancel</button>
                            <button onClick={applyClassicFilters} className="btn btn-primary" style={{ padding: '0.6rem 2rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Apply <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>↵</span>
                            </button>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
                    {/* Top Bar (Search & Visible Fields Toggle) */}
                    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search Field..."
                                className="input-field"
                                value={fieldSearchQuery}
                                onChange={(e) => setFieldSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2.5rem', height: '44px', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                            />
                            <SearchIcon size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            <span>Showing {ALL_COLUMNS.length - 2} Visible Fields</span>
                        </div>
                    </div>

                    {/* Table Layout */}
                    <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
                        {/* Table Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 1.25fr) minmax(250px, 1.5fr)', gap: '1.5rem', padding: '1rem 1.5rem', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.85rem', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
                            <div>Column Name</div>
                            <div>Select Filter Type</div>
                            <div>Enter Your Search</div>
                        </div>

                        {/* Groups */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {FIELD_GROUPS.map(group => {
                                const filteredKeys = group.keys.filter(key => {
                                    const col = ALL_COLUMNS.find(c => c.key === key);
                                    return col && !['resume', 'leads'].includes(col.key) && col.label.toLowerCase().includes(fieldSearchQuery.toLowerCase());
                                });

                                if (filteredKeys.length === 0) return null;
                                const isExpanded = fieldSearchQuery ? true : expandedGroups.includes(group.name);

                                return (
                                    <div key={group.name} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div 
                                            onClick={() => toggleGroup(group.name)}
                                            style={{ 
                                                padding: '1rem 1.5rem', 
                                                fontSize: '0.95rem', 
                                                fontWeight: 'bold', 
                                                color: 'var(--primary)', 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                cursor: 'pointer',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                borderBottom: '1px solid var(--border)'
                                            }}
                                        >
                                            <div style={{ border: '1px solid currentColor', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                                                <ChevronDownIcon size={14} style={{ transform: isExpanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                                            </div>
                                            {group.name}
                                        </div>
                                        {isExpanded && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {filteredKeys.map(key => {
                                                    const col = ALL_COLUMNS.find(c => c.key === key)!;
                                                    const fType = getFieldType(col.key);
                                                    const currentOp = localFilters[col.key]?.operator || (fType === 'date' ? 'is after' : 'contains');
                                                    const operatorsList = fType === 'date' ? DATE_OPERATORS : (fType === 'select' ? SELECT_OPERATORS : TEXT_OPERATORS);

                                                    return (
                                                        <div key={col.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 1.25fr) minmax(250px, 1.5fr)', gap: '1.5rem', padding: '1.25rem 1.5rem', alignItems: 'start', borderBottom: '1px solid var(--border)', background: 'white' }}>
                                                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', paddingTop: '0.6rem' }}>{col.label}</div>
                                                            <div>
                                                                <select 
                                                                    className="input-field" 
                                                                    style={{ height: '42px', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                                                    value={currentOp}
                                                                    onChange={(e) => {
                                                                        setLocalFilters({...localFilters, [col.key]: { 
                                                                            operator: e.target.value,
                                                                            value: localFilters[col.key]?.value || ''
                                                                        }});
                                                                    }}
                                                                >
                                                                    {operatorsList.map(op => (
                                                                        <option key={op} value={op}>{op}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <input 
                                                                    type={fType === 'date' ? 'date' : 'text'}
                                                                    className="input-field"
                                                                    placeholder={fType === 'select' ? "Select Option" : (fType === 'date' ? "month dd, yy" : "Enter here...")}
                                                                    style={{ height: '42px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', opacity: ['has any value', 'is empty'].includes(currentOp) ? 0.5 : 1 }}
                                                                    disabled={['has any value', 'is empty'].includes(currentOp)}
                                                                    value={localFilters[col.key]?.value || ''}
                                                                    onChange={(e) => {
                                                                        setLocalFilters({...localFilters, [col.key]: { 
                                                                            operator: currentOp, 
                                                                            value: e.target.value 
                                                                        }});
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>`;

if (regex.test(content)) {
    content = content.replace(regex, newSection);
    fs.writeFileSync(file, content);
    console.log("Successfully replaced Modal block!");
} else {
    console.log("Failed to match regex Regex didn't match.");
}
